-- chkit-migration-format: v1
-- generated-at: 2026-03-03T18:39:09.935Z
-- cli-version: 0.1.0-beta.15
-- definition-count: 5
-- operation-count: 6
-- rename-suggestion-count: 0
-- risk-summary: safe=6, caution=0, danger=0

-- operation: create_database key=database:rudel risk=safe
CREATE DATABASE IF NOT EXISTS rudel;

-- operation: create_table key=table:rudel.claude_sessions risk=safe
CREATE TABLE IF NOT EXISTS rudel.claude_sessions
(
  `session_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `last_interaction_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `session_id` String,
  `organization_id` String,
  `project_path` String,
  `git_remote` String DEFAULT '''''',
  `package_name` String DEFAULT '''''',
  `package_type` String DEFAULT '''''',
  `content` String,
  `ingested_at` DateTime64(3, 'UTC') DEFAULT now64(3),
  `user_id` String,
  `git_branch` Nullable(String),
  `git_sha` Nullable(String),
  `tag` Nullable(String),
  `subagents` Map(String, String) DEFAULT map()
) ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(toDate(session_date))
PRIMARY KEY ()
ORDER BY (`organization_id`, `session_date`, `session_id`)
TTL toDate(session_date) + toIntervalDay(365)
SETTINGS index_granularity = 8192, storage_policy = 's3';

-- operation: create_table key=table:rudel.codex_sessions risk=safe
CREATE TABLE IF NOT EXISTS rudel.codex_sessions
(
  `session_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `last_interaction_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `session_id` String,
  `organization_id` String,
  `project_path` String,
  `git_remote` String DEFAULT '''''',
  `package_name` String DEFAULT '''''',
  `package_type` String DEFAULT '''''',
  `content` String,
  `ingested_at` DateTime64(3, 'UTC') DEFAULT now64(3),
  `user_id` String,
  `git_branch` Nullable(String),
  `git_sha` Nullable(String),
  `tag` Nullable(String)
) ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(toDate(session_date))
PRIMARY KEY ()
ORDER BY (`organization_id`, `session_date`, `session_id`)
TTL toDate(session_date) + toIntervalDay(365)
SETTINGS index_granularity = 8192, storage_policy = 's3';

-- operation: create_table key=table:rudel.session_analytics risk=safe
CREATE TABLE IF NOT EXISTS rudel.session_analytics
(
  `session_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `last_interaction_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `session_id` String,
  `organization_id` String,
  `project_path` String,
  `git_remote` String DEFAULT '''''',
  `package_name` String DEFAULT '''''',
  `package_type` String DEFAULT '''''',
  `content` String,
  `subagents` Map(String, String) DEFAULT map(),
  `skills` Array(String) DEFAULT [],
  `slash_commands` Array(String) DEFAULT [],
  `subagent_types` Array(String) DEFAULT [],
  `ingested_at` DateTime64(3, 'UTC') DEFAULT now64(3),
  `user_id` String,
  `git_branch` Nullable(String),
  `git_sha` Nullable(String),
  `input_tokens` UInt64 DEFAULT 0,
  `output_tokens` UInt64 DEFAULT 0,
  `cache_read_input_tokens` UInt64 DEFAULT 0,
  `cache_creation_input_tokens` UInt64 DEFAULT 0,
  `total_tokens` UInt64 DEFAULT 0,
  `tag` Nullable(String),
  `source` LowCardinality(String) DEFAULT '''claude_code''',
  `total_interactions` UInt32 DEFAULT 0,
  `actual_duration_min` UInt32 DEFAULT 0,
  `avg_period_sec` Float64 DEFAULT 0,
  `median_period_sec` Float64 DEFAULT 0,
  `quick_responses` UInt32 DEFAULT 0,
  `normal_responses` UInt32 DEFAULT 0,
  `long_pauses` UInt32 DEFAULT 0,
  `error_count` UInt32 DEFAULT 0,
  `model_used` String DEFAULT '''''',
  `has_commit` UInt8 DEFAULT 0,
  `session_archetype` String DEFAULT '''standard''',
  `success_score` UInt8 DEFAULT 0,
  `used_plan_mode` UInt8 DEFAULT 0,
  `inference_duration_sec` UInt32 DEFAULT 0,
  `human_duration_sec` UInt32 DEFAULT 0,
  INDEX `idx_git_remote` (git_remote) TYPE set(0) GRANULARITY 4,
  INDEX `idx_model_used` (model_used) TYPE set(0) GRANULARITY 4,
  INDEX `idx_project_path` (project_path) TYPE set(0) GRANULARITY 4,
  INDEX `idx_source` (source) TYPE set(0) GRANULARITY 4,
  INDEX `idx_user_id` (user_id) TYPE set(0) GRANULARITY 4
) ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(toDate(session_date))
PRIMARY KEY ()
ORDER BY (`organization_id`, `session_date`, `session_id`)
SETTINGS index_granularity = 8192;

-- operation: create_materialized_view key=materialized_view:rudel.codex_session_analytics_mv risk=safe
CREATE MATERIALIZED VIEW IF NOT EXISTS rudel.codex_session_analytics_mv TO rudel.session_analytics AS
WITH arrayFilter( x -> x != '', splitByChar('\n', cs.content) ) AS _all_lines, arrayFilter(x -> JSONHas(x, 'timestamp'), _all_lines) AS _ts_lines, arrayMap( x -> parseDateTime64BestEffort(JSONExtractString(x, 'timestamp')), _ts_lines ) AS _timestamps, if(length(_timestamps) > 1, arrayMap(i -> dateDiff('second', _timestamps[i], _timestamps[i+1]), range(1, length(_timestamps))), [] ) AS _prompt_periods_sec, if(length(_timestamps) > 1, arrayMap(i -> if(i < length(_timestamps), dateDiff('second', _timestamps[i], _timestamps[i+1]), 0), range(1, length(_timestamps))), [] ) AS _inference_gaps, arrayFilter( x -> JSONExtractString(x, 'type') = 'response_item' OR JSONExtractString(x, 'type') = 'event_msg', _all_lines ) AS _interaction_lines, arrayFilter( x -> position(x, '"turn.completed"') > 0 OR position(x, '"response.completed"') > 0, _all_lines ) AS _completion_lines, arraySum(arrayMap(x -> toUInt64OrZero(JSONExtractRaw(JSONExtractRaw(x, 'payload'), 'usage', 'input_tokens')), _completion_lines)) AS _input_tokens, arraySum(arrayMap(x -> toUInt64OrZero(JSONExtractRaw(JSONExtractRaw(x, 'payload'), 'usage', 'output_tokens')), _completion_lines)) AS _output_tokens, arrayMin(_timestamps) AS _session_date, arrayMax(_timestamps) AS _last_interaction_date, dateDiff('minute', _session_date, _last_interaction_date) AS _duration_min, JSONExtractString( JSONExtractRaw( arrayElement( arrayFilter(x -> JSONExtractString(x, 'type') = 'session_meta', _all_lines), 1 ), 'payload' ), 'model_provider' ) AS _model_provider SELECT * EXCEPT (session_date, last_interaction_date), _session_date as session_date, _last_interaction_date as last_interaction_date, 'codex' as source, _input_tokens as input_tokens, _output_tokens as output_tokens, toUInt64(0) as cache_read_input_tokens, toUInt64(0) as cache_creation_input_tokens, _input_tokens + _output_tokens as total_tokens, [] :: Array(String) as skills, [] :: Array(String) as slash_commands, [] :: Array(String) as subagent_types, map() as subagents, toUInt32(length(_interaction_lines)) as total_interactions, toUInt32(_duration_min) as actual_duration_min, if(length(_prompt_periods_sec) > 0, round(arrayAvg(_prompt_periods_sec), 2), 0) as avg_period_sec, if( length(_prompt_periods_sec) > 0, toFloat64(arrayElement( arraySort(_prompt_periods_sec), toUInt64(ceil(length(_prompt_periods_sec) / 2)) )), 0 ) as median_period_sec, toUInt32(arrayCount(x -> x < 5, _prompt_periods_sec)) as quick_responses, toUInt32(arrayCount(x -> x >= 5 AND x <= 60, _prompt_periods_sec)) as normal_responses, toUInt32(arrayCount(x -> x > 300, _prompt_periods_sec)) as long_pauses, toUInt32( length(extractAll(cs.content, '"status":"failed"')) + length(extractAll(cs.content, '"error"')) ) as error_count, if(_model_provider != '', _model_provider, 'unknown') as model_used, toUInt8(if(cs.git_sha IS NOT NULL AND cs.git_sha != '', 1, 0)) as has_commit, toUInt8(0) as used_plan_mode, toUInt32(arraySum(_inference_gaps)) as inference_duration_sec, toUInt32(0) as human_duration_sec, CASE WHEN _duration_min <= 10 AND (_input_tokens + _output_tokens) < 500000 AND _output_tokens > 1000 THEN 'quick_win' WHEN _duration_min > 30 AND _output_tokens > 50000 AND cs.git_sha IS NOT NULL AND cs.git_sha != '' THEN 'deep_work' WHEN (_input_tokens + _output_tokens) > 1000000 AND (_output_tokens / nullif(_input_tokens, 0)) < 0.3 AND _duration_min > 20 THEN 'struggle' WHEN _duration_min < 3 AND _output_tokens < 500 THEN 'abandoned' ELSE 'standard' END as session_archetype, toUInt8(round( 50 + (if(cs.git_sha IS NOT NULL AND cs.git_sha != '', 20, 0)) + (if((_output_tokens / nullif(_input_tokens, 0)) > 0.5, 15, 0)) - (if((_input_tokens + _output_tokens) > 1500000 AND (cs.git_sha IS NULL OR cs.git_sha = ''), 20, 0)) - (if(_duration_min < 2 AND _output_tokens < 200, 30, 0)) - (least(toUInt32( length(extractAll(cs.content, '"status":"failed"')) + length(extractAll(cs.content, '"error"')) ), 10) * 2) )) as success_score FROM rudel.codex_sessions AS cs WHERE length(_timestamps) > 0 QUALIFY ROW_NUMBER() OVER (PARTITION BY cs.session_id ORDER BY cs.ingested_at DESC) = 1;

-- operation: create_materialized_view key=materialized_view:rudel.session_analytics_mv risk=safe
CREATE MATERIALIZED VIEW IF NOT EXISTS rudel.session_analytics_mv TO rudel.session_analytics AS
WITH arrayFilter( x -> JSONExtractString(x, 'type') IN ('user', 'assistant'), splitByChar('\n', cs.content) ) AS _interaction_lines, arrayFilter(x -> JSONHas(x, 'timestamp'), _interaction_lines) AS _ts_lines, arrayMap( x -> parseDateTime64BestEffort(JSONExtractString(x, 'timestamp')), _ts_lines ) AS _timestamps, arrayMap( x -> JSONExtractString(x, 'type'), _ts_lines ) AS _msg_types, if(length(_timestamps) > 1, arrayMap(i -> dateDiff('second', _timestamps[i], _timestamps[i+1]), range(1, length(_timestamps))), [] ) AS _prompt_periods_sec, if(length(_timestamps) > 1, arrayMap(i -> if(_msg_types[i] = 'user' AND _msg_types[i+1] = 'assistant', dateDiff('second', _timestamps[i], _timestamps[i+1]), 0), range(1, length(_timestamps))), [] ) AS _inference_gaps, if(length(_timestamps) > 1, arrayMap(i -> if(_msg_types[i] = 'assistant' AND _msg_types[i+1] = 'user', dateDiff('second', _timestamps[i], _timestamps[i+1]), 0), range(1, length(_timestamps))), [] ) AS _human_gaps, arrayFilter( x -> JSONExtractString(x, 'type') = 'assistant' AND JSONHas(x, 'message'), splitByChar('\n', cs.content) ) AS _assistant_lines, arraySum(arrayMap(x -> toUInt64OrZero(JSONExtractRaw(JSONExtractRaw(x, 'message'), 'usage', 'input_tokens')), _assistant_lines)) AS _input_tokens, arraySum(arrayMap(x -> toUInt64OrZero(JSONExtractRaw(JSONExtractRaw(x, 'message'), 'usage', 'output_tokens')), _assistant_lines)) AS _output_tokens, arraySum(arrayMap(x -> toUInt64OrZero(JSONExtractRaw(JSONExtractRaw(x, 'message'), 'usage', 'cache_read_input_tokens')), _assistant_lines)) AS _cache_read, arraySum(arrayMap(x -> toUInt64OrZero(JSONExtractRaw(JSONExtractRaw(x, 'message'), 'usage', 'cache_creation_input_tokens')), _assistant_lines)) AS _cache_creation, arrayDistinct(arrayFilter(x -> x != '', extractAll(cs.content, '"name":"Skill"[^}]*"skill":"([^"]+)"'))) AS _skills, arrayDistinct(arrayFilter(x -> x != '', extractAll(cs.content, '"name":"Task"[^}]*"subagent_type":"([^"]+)"'))) AS _subagent_types, arrayDistinct(arrayFilter(x -> x != '', extractAll(cs.content, '<command-name>/([^<]+)</command-name>'))) AS _slash_commands, arrayMin(_timestamps) AS _session_date, arrayMax(_timestamps) AS _last_interaction_date, dateDiff('minute', _session_date, _last_interaction_date) AS _duration_min SELECT * EXCEPT (session_date, last_interaction_date), _session_date as session_date, _last_interaction_date as last_interaction_date, 'claude_code' as source, _input_tokens as input_tokens, _output_tokens as output_tokens, _cache_read as cache_read_input_tokens, _cache_creation as cache_creation_input_tokens, _input_tokens + _output_tokens as total_tokens, _skills as skills, _slash_commands as slash_commands, _subagent_types as subagent_types, toUInt32(length(_timestamps)) as total_interactions, toUInt32(_duration_min) as actual_duration_min, if(length(_prompt_periods_sec) > 0, round(arrayAvg(_prompt_periods_sec), 2), 0) as avg_period_sec, if( length(_prompt_periods_sec) > 0, toFloat64(arrayElement( arraySort(_prompt_periods_sec), toUInt64(ceil(length(_prompt_periods_sec) / 2)) )), 0 ) as median_period_sec, toUInt32(arrayCount(x -> x < 5, _prompt_periods_sec)) as quick_responses, toUInt32(arrayCount(x -> x >= 5 AND x <= 60, _prompt_periods_sec)) as normal_responses, toUInt32(arrayCount(x -> x > 300, _prompt_periods_sec)) as long_pauses, toUInt32( length(extractAll(cs.content, '"isApiErrorMessage":true')) + length(extractAll(cs.content, '"is_error":true')) ) as error_count, JSONExtractString( JSONExtractRaw( arrayElement( arrayFilter( x -> JSONExtractString(x, 'type') = 'assistant', splitByChar('\n', cs.content) ), -1 ), 'message' ), 'model' ) as model_used, toUInt8(if(cs.git_sha IS NOT NULL AND cs.git_sha != '', 1, 0)) as has_commit, toUInt8(if(position(cs.content, '"name":"EnterPlanMode"') > 0, 1, 0)) as used_plan_mode, toUInt32(arraySum(_inference_gaps)) as inference_duration_sec, toUInt32(arraySum(_human_gaps)) as human_duration_sec, CASE WHEN _duration_min <= 10 AND (_input_tokens + _output_tokens) < 500000 AND _output_tokens > 1000 THEN 'quick_win' WHEN _duration_min > 30 AND _output_tokens > 50000 AND cs.git_sha IS NOT NULL AND cs.git_sha != '' THEN 'deep_work' WHEN (_input_tokens + _output_tokens) > 1000000 AND (_output_tokens / nullif(_input_tokens, 0)) < 0.3 AND _duration_min > 20 THEN 'struggle' WHEN length(_skills) >= 3 AND (cs.git_sha IS NULL OR cs.git_sha = '') AND (_input_tokens + _output_tokens) > 200000 THEN 'exploration' WHEN _duration_min < 3 AND _output_tokens < 500 THEN 'abandoned' ELSE 'standard' END as session_archetype, toUInt8(round( 50 + (if(cs.git_sha IS NOT NULL AND cs.git_sha != '', 20, 0)) + (if((_output_tokens / nullif(_input_tokens, 0)) > 0.5, 15, 0)) + (least(toUInt32(length(_skills)), 3) * 5) - (if((_input_tokens + _output_tokens) > 1500000 AND (cs.git_sha IS NULL OR cs.git_sha = ''), 20, 0)) - (if(_duration_min < 2 AND _output_tokens < 200, 30, 0)) - (least(toUInt32( length(extractAll(cs.content, '"isApiErrorMessage":true')) + length(extractAll(cs.content, '"is_error":true')) ), 10) * 2) )) as success_score FROM rudel.claude_sessions AS cs WHERE length(_timestamps) > 0 QUALIFY ROW_NUMBER() OVER (PARTITION BY cs.session_id ORDER BY cs.ingested_at DESC) = 1;
