-- Session Analytics Table + Materialized View
-- Creates flick.session_analytics (target table) and flick.session_analytics_mv (refreshable MV)
-- The MV processes raw claude_sessions data to extract timing metrics, success scores, and archetypes
-- Refreshes every 5 minutes automatically

-- Step 1: Create the target table
CREATE TABLE IF NOT EXISTS flick.session_analytics (
    session_id String,
    user_id String,
    session_date DateTime,
    project_path String,
    organization_id String,
    repository String,

    -- Interaction timing metrics
    total_interactions UInt32,
    min_period_sec UInt32,
    max_period_sec UInt32,
    avg_period_sec Float64,
    median_period_sec Float64,
    quick_responses UInt32,
    normal_responses UInt32,
    long_pauses UInt32,
    actual_duration_min UInt32,

    -- Duration metrics
    duration_minutes UInt32,
    last_interaction_date DateTime,

    -- Token metrics
    total_tokens UInt64,
    input_tokens UInt64,
    output_tokens UInt64,
    output_input_ratio Float64,

    -- Git activity
    git_sha String,
    git_branch String,
    has_commit UInt8,

    -- Feature usage counts
    subagents_count UInt32,
    skills_count UInt32,
    slash_commands_count UInt32,

    -- Feature arrays
    subagent_types Array(String),
    skills Array(String),
    slash_commands Array(String),

    -- Success metrics
    session_archetype String,
    success_score UInt8,

    -- Task type classification
    task_type String,
    task_type_confidence Float32,
    classification_signals Array(String),

    -- Effectiveness correlation factors
    error_count UInt32,
    model_used String,
    used_plan_mode UInt8
) ENGINE = ReplacingMergeTree()
ORDER BY (session_date, session_id)
SETTINGS index_granularity = 8192;

-- Step 2: Create the refreshable materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS flick.session_analytics_mv
REFRESH EVERY 5 MINUTE APPEND
TO flick.session_analytics
AS
WITH recent_sessions AS (
  SELECT *
  FROM flick.claude_sessions
  WHERE last_interaction_date >= now() - INTERVAL 1 HOUR
),
deduplicated_sessions AS (
  SELECT
    session_id,
    any(user_id) as user_id,
    any(session_date) as session_date,
    any(last_interaction_date) as last_interaction_date,
    any(project_path) as project_path,
    any(organization_id) as organization_id,
    any(repository) as repository,
    mapKeys(any(subagents)) as subagent_types,
    any(skills) as skills,
    any(slash_commands) as slash_commands,
    any(total_tokens) as total_tokens,
    any(input_tokens) as input_tokens,
    any(output_tokens) as output_tokens,
    any(git_sha) as git_sha,
    any(git_branch) as git_branch
  FROM recent_sessions
  GROUP BY session_id
),
session_timestamps AS (
  SELECT
    session_id,
    arrayMap(
      x -> parseDateTime64BestEffort(JSONExtractString(x, 'timestamp')),
      arrayFilter(
        x -> JSONHas(x, 'timestamp'),
        splitByChar('\n', content)
      )
    ) as timestamps
  FROM recent_sessions
),
parsed_messages AS (
  SELECT
    ds.session_id,
    ds.user_id,
    ds.session_date,
    ds.last_interaction_date,
    ds.project_path,
    ds.organization_id,
    ds.repository,
    ds.subagent_types,
    ds.skills,
    ds.slash_commands,
    ds.total_tokens,
    ds.input_tokens,
    ds.output_tokens,
    ds.git_sha,
    ds.git_branch,
    st.timestamps
  FROM deduplicated_sessions ds
  LEFT JOIN session_timestamps st ON ds.session_id = st.session_id
),
time_diffs AS (
  SELECT
    session_id,
    user_id,
    session_date,
    last_interaction_date,
    project_path,
    organization_id,
    repository,
    subagent_types,
    skills,
    slash_commands,
    total_tokens,
    input_tokens,
    output_tokens,
    git_sha,
    git_branch,
    timestamps,
    arrayMap(
      i -> dateDiff('second', timestamps[i], timestamps[i+1]),
      range(1, length(timestamps))
    ) as prompt_periods_sec
  FROM parsed_messages
  WHERE length(timestamps) > 1
)
SELECT
  session_id,
  user_id,
  session_date,
  project_path,
  organization_id,
  repository,

  length(timestamps) as total_interactions,
  arrayMin(prompt_periods_sec) as min_period_sec,
  arrayMax(prompt_periods_sec) as max_period_sec,
  round(arrayAvg(prompt_periods_sec), 2) as avg_period_sec,
  arrayElement(arraySort(prompt_periods_sec), toUInt64(ceil(length(prompt_periods_sec) / 2))) as median_period_sec,
  arrayCount(x -> x < 5, prompt_periods_sec) as quick_responses,
  arrayCount(x -> x >= 5 AND x <= 60, prompt_periods_sec) as normal_responses,
  arrayCount(x -> x > 300, prompt_periods_sec) as long_pauses,
  dateDiff('minute', arrayMin(timestamps), arrayMax(timestamps)) as actual_duration_min,

  dateDiff('minute', session_date, last_interaction_date) as duration_minutes,
  last_interaction_date,

  total_tokens,
  input_tokens,
  output_tokens,
  round(output_tokens / nullif(input_tokens, 0), 2) as output_input_ratio,

  git_sha,
  git_branch,
  if(git_sha IS NOT NULL AND git_sha != '', 1, 0) as has_commit,

  length(subagent_types) as subagents_count,
  length(skills) as skills_count,
  length(slash_commands) as slash_commands_count,

  subagent_types,
  skills,
  slash_commands,

  CASE
    WHEN dateDiff('minute', session_date, last_interaction_date) <= 10
         AND total_tokens < 500000
         AND output_tokens > 1000
    THEN 'quick_win'
    WHEN dateDiff('minute', session_date, last_interaction_date) > 30
         AND output_tokens > 50000
         AND git_sha IS NOT NULL AND git_sha != ''
    THEN 'deep_work'
    WHEN total_tokens > 1000000
         AND (output_tokens / nullif(input_tokens, 0)) < 0.3
         AND dateDiff('minute', session_date, last_interaction_date) > 20
    THEN 'struggle'
    WHEN length(skills) >= 3
         AND (git_sha IS NULL OR git_sha = '')
         AND total_tokens > 200000
    THEN 'exploration'
    WHEN dateDiff('minute', session_date, last_interaction_date) < 3
         AND output_tokens < 500
    THEN 'abandoned'
    ELSE 'standard'
  END as session_archetype,

  toUInt8(round(
    50
    + (if(git_sha IS NOT NULL AND git_sha != '', 20, 0))
    + (if((output_tokens / nullif(input_tokens, 0)) > 0.5, 15, 0))
    + (least(length(skills), 3) * 5)
    - (if(total_tokens > 1500000 AND (git_sha IS NULL OR git_sha = ''), 20, 0))
    - (if(dateDiff('minute', session_date, last_interaction_date) < 2 AND output_tokens < 200, 30, 0))
  )) as success_score,

  multiIf(
    rand() % 6 = 0, 'bug_fix',
    rand() % 6 = 1, 'new_feature',
    rand() % 6 = 2, 'refactoring',
    rand() % 6 = 3, 'tests',
    rand() % 6 = 4, 'documentation',
    'research'
  ) as task_type,
  round(rand() / 4294967295.0, 2) as task_type_confidence,
  [
    concat('signal_', toString(rand() % 10)),
    concat('signal_', toString(rand() % 10))
  ] as classification_signals,

  toUInt32(rand() % 20) as error_count,
  multiIf(
    rand() % 5 = 0, 'claude-opus-4',
    rand() % 5 = 1, 'claude-sonnet-4',
    rand() % 5 = 2, 'claude-sonnet-3.5',
    rand() % 5 = 3, 'claude-haiku',
    'unknown'
  ) as model_used,
  toUInt8(rand() % 2) as used_plan_mode

FROM time_diffs
GROUP BY
  session_id, user_id, session_date, last_interaction_date,
  project_path, organization_id, repository,
  total_tokens, input_tokens, output_tokens,
  git_sha, git_branch, subagent_types, skills, slash_commands,
  timestamps, prompt_periods_sec
ORDER BY session_date DESC;
