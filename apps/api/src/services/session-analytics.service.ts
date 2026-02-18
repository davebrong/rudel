import { queryClickhouse, escapeString, buildDateFilter } from '../clickhouse.js';

export interface SessionAnalyticsRaw {
  session_id: string;
  user_id: string;
  session_date: string;
  project_path: string;
  organization_id: string;
  repository: string;

  // Interaction timing metrics
  total_interactions: number;
  min_period_sec: number;
  max_period_sec: number;
  avg_period_sec: number;
  median_period_sec: number;
  quick_responses: number;
  normal_responses: number;
  long_pauses: number;
  actual_duration_min: number;

  // Duration metrics
  duration_minutes: number;
  last_interaction_date: string;

  // Token metrics
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  output_input_ratio: number;

  // Git activity
  git_sha: string;
  git_branch: string;
  has_commit: number;

  // Feature usage counts
  subagents_count: number;
  skills_count: number;
  slash_commands_count: number;

  // Feature arrays
  subagent_types: string[];
  skills: string[];
  slash_commands: string[];

  // Success metrics
  session_archetype: string;
  success_score: number;

  // Task type classification
  task_type: string;
  task_type_confidence: number;
  classification_signals: string[];

  // Effectiveness correlation factors
  error_count: number;
  model_used: string;
  used_plan_mode: number;
}

export interface SessionAnalytics {
  session_id: string;
  user_id: string;
  session_date: string;
  project_path: string;
  repository: string | null;
  duration_min: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  success_score: number;
  total_interactions: number;
  avg_period_sec: number;
  subagent_types: string[];
  skills: string[];
  slash_commands: string[];
  has_commit: boolean;
  session_archetype: string;
  task_type: string;
  model_used: string;
}

export interface SessionAnalyticsSummary {
  total_sessions: number;
  total_interactions: number;
  avg_session_duration_min: number;
  avg_interactions_per_session: number;
  avg_response_time_sec: number;
  median_response_time_sec: number;
  quick_response_rate: number;
  long_pause_rate: number;
  subagents_adoption_rate: number;
  skills_adoption_rate: number;
  slash_commands_adoption_rate: number;
}

export interface SessionDetail {
  session_id: string;
  user_id: string;
  session_date: string;
  last_interaction_date: string;
  project_path: string;
  repository: string | null;
  content: string;
  subagents: Record<string, string>;
  skills: string[];
  slash_commands: string[];
  git_branch: string | null;
  git_sha: string | null;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  success_score?: number;
  duration_min?: number;
  total_interactions?: number;
}

/**
 * Get session analytics from the materialized view
 */
export async function getSessionAnalytics(
  orgId: string,
  params: {
    days?: number;
    user_id?: string;
    project_path?: string;
    repository?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'date' | 'duration' | 'interactions';
    sort_order?: 'asc' | 'desc';
  } = {}
): Promise<SessionAnalytics[]> {
  const {
    days = 30,
    user_id,
    project_path,
    repository,
    limit = 50,
    offset = 0,
    sort_by = 'date',
    sort_order = 'desc',
  } = params;

  const org = escapeString(orgId);
  const d = Number(days);
  const lim = Number(limit);
  const off = Number(offset);

  let filters = '';
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }
  if (repository) {
    filters += ` AND repository = '${escapeString(repository)}'`;
  }

  const sortColumn =
    sort_by === 'duration'
      ? 'actual_duration_min'
      : sort_by === 'interactions'
      ? 'total_interactions'
      : 'session_date';
  const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

  const query = `
    SELECT
      session_id,
      user_id,
      formatDateTime(session_date, '%Y-%m-%d %H:%i:%S') as session_date,
      project_path,
      organization_id,
      repository,
      total_interactions,
      min_period_sec,
      max_period_sec,
      avg_period_sec,
      median_period_sec,
      quick_responses,
      normal_responses,
      long_pauses,
      actual_duration_min,
      duration_minutes,
      formatDateTime(last_interaction_date, '%Y-%m-%d %H:%i:%S') as last_interaction_date,
      total_tokens,
      input_tokens,
      output_tokens,
      output_input_ratio,
      git_sha,
      git_branch,
      has_commit,
      subagents_count,
      skills_count,
      slash_commands_count,
      subagent_types,
      skills,
      slash_commands,
      session_archetype,
      success_score,
      task_type,
      task_type_confidence,
      classification_signals,
      error_count,
      model_used,
      used_plan_mode
    FROM (
      SELECT *
      FROM flick.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
    ) as filtered
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ${lim}
    OFFSET ${off}
  `;

  const raw = await queryClickhouse<SessionAnalyticsRaw>(query);

  return raw.map((row): SessionAnalytics => ({
    session_id: row.session_id,
    user_id: row.user_id,
    session_date: row.session_date,
    project_path: row.project_path,
    repository: row.repository || null,
    duration_min: row.actual_duration_min,
    total_tokens: row.total_tokens,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    success_score: row.success_score,
    total_interactions: row.total_interactions,
    avg_period_sec: row.avg_period_sec,
    subagent_types: row.subagent_types,
    skills: row.skills,
    slash_commands: row.slash_commands,
    has_commit: row.has_commit > 0,
    session_archetype: row.session_archetype,
    task_type: row.task_type,
    model_used: row.model_used,
  }));
}

/**
 * Get summary statistics from session analytics
 */
export async function getSessionAnalyticsSummary(
  orgId: string,
  params: {
    days?: number;
    user_id?: string;
    project_path?: string;
  } = {}
): Promise<SessionAnalyticsSummary> {
  const { days = 30, user_id, project_path } = params;
  const org = escapeString(orgId);
  const d = Number(days);

  let filters = '';
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }

  const query = `
    WITH totals AS (
      SELECT
        COUNT(*) as cnt_sessions,
        SUM(total_interactions) as sum_interactions,
        SUM(quick_responses) as sum_quick_responses,
        SUM(long_pauses) as sum_long_pauses,
        AVG(actual_duration_min) as avg_duration,
        AVG(total_interactions) as avg_interactions,
        AVG(avg_period_sec) as avg_response,
        AVG(median_period_sec) as med_response,
        countIf(subagents_count > 0) as cnt_subagents,
        countIf(skills_count > 0) as cnt_skills,
        countIf(slash_commands_count > 0) as cnt_slash
      FROM flick.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      cnt_sessions as total_sessions,
      sum_interactions as total_interactions,
      round(avg_duration, 2) as avg_session_duration_min,
      round(avg_interactions, 2) as avg_interactions_per_session,
      round(avg_response, 2) as avg_response_time_sec,
      round(med_response, 2) as median_response_time_sec,
      round(sum_quick_responses * 100.0 / if(sum_interactions > 0, sum_interactions, 1), 2) as quick_response_rate,
      round(sum_long_pauses * 100.0 / if(sum_interactions > 0, sum_interactions, 1), 2) as long_pause_rate,
      round(cnt_subagents * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as subagents_adoption_rate,
      round(cnt_skills * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as skills_adoption_rate,
      round(cnt_slash * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as slash_commands_adoption_rate
    FROM totals
  `;

  const results = await queryClickhouse<SessionAnalyticsSummary>(query);

  if (results.length === 0) {
    return {
      total_sessions: 0,
      total_interactions: 0,
      avg_session_duration_min: 0,
      avg_interactions_per_session: 0,
      avg_response_time_sec: 0,
      median_response_time_sec: 0,
      quick_response_rate: 0,
      long_pause_rate: 0,
      subagents_adoption_rate: 0,
      skills_adoption_rate: 0,
      slash_commands_adoption_rate: 0,
    };
  }

  return results[0]!;
}

export interface SessionSummaryComparisonPeriod {
  total_sessions: number;
  avg_session_duration_min: number;
  avg_response_time_sec: number;
  subagents_adoption_rate: number;
  skills_adoption_rate: number;
  slash_commands_adoption_rate: number;
}

/**
 * Get session analytics summary with period-over-period comparison
 */
export async function getSessionAnalyticsSummaryComparison(
  orgId: string,
  params: {
    days?: number;
    user_id?: string;
    project_path?: string;
  } = {}
) {
  const { days = 7, user_id, project_path } = params;
  const org = escapeString(orgId);
  const d = Number(days);
  const previousDays = d * 2;

  let filters = '';
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }

  const summarySQL = (dateCondition: string) => `
    WITH totals AS (
      SELECT
        COUNT(*) as cnt_sessions,
        AVG(actual_duration_min) as avg_duration,
        AVG(avg_period_sec) as avg_response,
        countIf(subagents_count > 0) as cnt_subagents,
        countIf(skills_count > 0) as cnt_skills,
        countIf(slash_commands_count > 0) as cnt_slash
      FROM flick.session_analytics
      WHERE ${dateCondition}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      cnt_sessions as total_sessions,
      round(avg_duration, 2) as avg_session_duration_min,
      round(avg_response, 2) as avg_response_time_sec,
      round(cnt_subagents * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as subagents_adoption_rate,
      round(cnt_skills * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as skills_adoption_rate,
      round(cnt_slash * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as slash_commands_adoption_rate
    FROM totals
  `;

  const currentQuery = summarySQL(buildDateFilter(d));
  const previousQuery = summarySQL(`session_date >= now() - INTERVAL ${previousDays} DAY AND session_date < now() - INTERVAL ${d} DAY`);

  const [currentData, previousData] = await Promise.all([
    queryClickhouse<SessionSummaryComparisonPeriod>(currentQuery),
    queryClickhouse<SessionSummaryComparisonPeriod>(previousQuery),
  ]);

  const defaultPeriod: SessionSummaryComparisonPeriod = {
    total_sessions: 0,
    avg_session_duration_min: 0,
    avg_response_time_sec: 0,
    subagents_adoption_rate: 0,
    skills_adoption_rate: 0,
    slash_commands_adoption_rate: 0,
  };

  const current = currentData[0] || defaultPeriod;
  const previous = previousData[0] || defaultPeriod;

  const calculateChange = (curr: number, prev: number) => {
    if (!prev || prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  const changes = {
    total_sessions: calculateChange(current.total_sessions || 0, previous.total_sessions || 0),
    avg_session_duration_min: calculateChange(current.avg_session_duration_min || 0, previous.avg_session_duration_min || 0),
    avg_response_time_sec: calculateChange(current.avg_response_time_sec || 0, previous.avg_response_time_sec || 0),
  };

  return { current, previous, changes };
}

/**
 * Get interaction timing distribution
 */
export async function getInteractionTimingDistribution(
  orgId: string,
  params: {
    days?: number;
    user_id?: string;
    project_path?: string;
  } = {}
): Promise<Array<{ bucket: string; count: number; percentage: number }>> {
  const { days = 30, user_id, project_path } = params;
  const org = escapeString(orgId);
  const d = Number(days);

  let filters = '';
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }

  const query = `
    WITH total AS (
      SELECT SUM(total_interactions) as total_count
      FROM flick.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      'Instant (< 5s)' as bucket,
      SUM(quick_responses) as count,
      round(SUM(quick_responses) * 100.0 / (SELECT total_count FROM total), 2) as percentage
    FROM flick.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}

    UNION ALL

    SELECT
      'Normal (5-60s)' as bucket,
      SUM(normal_responses) as count,
      round(SUM(normal_responses) * 100.0 / (SELECT total_count FROM total), 2) as percentage
    FROM flick.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}

    UNION ALL

    SELECT
      'Long Pause (> 5m)' as bucket,
      SUM(long_pauses) as count,
      round(SUM(long_pauses) * 100.0 / (SELECT total_count FROM total), 2) as percentage
    FROM flick.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}

    ORDER BY count DESC
  `;

  return queryClickhouse<{ bucket: string; count: number; percentage: number }>(query);
}

/**
 * Get task type distribution for pie chart
 */
export async function getTaskTypeDistribution(
  orgId: string,
  params: {
    days?: number;
    user_id?: string;
    project_path?: string;
  } = {}
): Promise<Array<{ task_type: string; count: number; percentage: number; avg_confidence: number }>> {
  const { days = 30, user_id, project_path } = params;
  const org = escapeString(orgId);
  const d = Number(days);

  let filters = '';
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }

  const query = `
    WITH total AS (
      SELECT COUNT(*) as total_count
      FROM flick.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      task_type,
      COUNT(*) as count,
      round(COUNT(*) * 100.0 / (SELECT total_count FROM total), 2) as percentage,
      round(AVG(task_type_confidence), 2) as avg_confidence
    FROM flick.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}
    GROUP BY task_type
    ORDER BY count DESC
  `;

  return queryClickhouse<{ task_type: string; count: number; percentage: number; avg_confidence: number }>(query);
}

/**
 * Get sessions filtered by task type
 */
export async function getSessionsByTaskType(
  orgId: string,
  params: {
    days?: number;
    task_type?: string;
    user_id?: string;
    project_path?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<SessionAnalytics[]> {
  const { days = 30, task_type, user_id, project_path, limit = 50, offset = 0 } = params;
  const org = escapeString(orgId);
  const d = Number(days);
  const lim = Number(limit);
  const off = Number(offset);

  let filters = '';
  if (task_type) {
    filters += ` AND task_type = '${escapeString(task_type)}'`;
  }
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }

  const query = `
    SELECT
      session_id,
      user_id,
      formatDateTime(session_date, '%Y-%m-%d %H:%i:%S') as session_date,
      project_path,
      organization_id,
      repository,
      total_interactions,
      min_period_sec,
      max_period_sec,
      avg_period_sec,
      median_period_sec,
      quick_responses,
      normal_responses,
      long_pauses,
      actual_duration_min,
      duration_minutes,
      formatDateTime(last_interaction_date, '%Y-%m-%d %H:%i:%S') as last_interaction_date,
      total_tokens,
      input_tokens,
      output_tokens,
      output_input_ratio,
      git_sha,
      git_branch,
      has_commit,
      subagents_count,
      skills_count,
      slash_commands_count,
      subagent_types,
      skills,
      slash_commands,
      session_archetype,
      success_score,
      task_type,
      task_type_confidence,
      classification_signals,
      error_count,
      model_used,
      used_plan_mode
    FROM flick.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}
    ORDER BY session_date DESC
    LIMIT ${lim}
    OFFSET ${off}
  `;

  const raw = await queryClickhouse<SessionAnalyticsRaw>(query);

  return raw.map((row): SessionAnalytics => ({
    session_id: row.session_id,
    user_id: row.user_id,
    session_date: row.session_date,
    project_path: row.project_path,
    repository: row.repository || null,
    duration_min: row.actual_duration_min,
    total_tokens: row.total_tokens,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    success_score: row.success_score,
    total_interactions: row.total_interactions,
    avg_period_sec: row.avg_period_sec,
    subagent_types: row.subagent_types,
    skills: row.skills,
    slash_commands: row.slash_commands,
    has_commit: row.has_commit > 0,
    session_archetype: row.session_archetype,
    task_type: row.task_type,
    model_used: row.model_used,
  }));
}

/**
 * Get flexible dimension analysis with optional split-by for stacked charts
 */
export async function getSessionDimensionAnalysis(
  orgId: string,
  params: {
    days?: number;
    dimension: string;
    metric: string;
    split_by?: string;
    limit?: number;
    user_id?: string;
    project_path?: string;
  }
) {
  const { days = 7, dimension, metric, split_by, limit = 10, user_id, project_path } = params;
  const org = escapeString(orgId);
  const d = Number(days);
  const lim = Number(limit);

  // Validate dimension parameter
  const validDimensions = [
    'user_id',
    'project_path',
    'repository',
    'session_archetype',
    'task_type',
    'model_used',
    'has_commit',
    'used_plan_mode',
    'used_skills',
    'used_slash_commands',
    'used_subagents',
  ];

  if (!validDimensions.includes(dimension)) {
    throw new Error(`Invalid dimension: ${dimension}`);
  }

  if (split_by && !validDimensions.includes(split_by)) {
    throw new Error(`Invalid split_by dimension: ${split_by}`);
  }

  // Map metric to SQL expression
  const metricExpressions: Record<string, string> = {
    session_count: 'COUNT(*)',
    avg_duration: 'round(AVG(actual_duration_min), 2)',
    total_duration: 'round(SUM(actual_duration_min) / 60, 2)',
    avg_interactions: 'round(AVG(total_interactions), 2)',
    total_interactions: 'SUM(total_interactions)',
    avg_response_time: 'round(AVG(avg_period_sec), 2)',
    median_response_time: 'round(AVG(median_period_sec), 2)',
    avg_tokens: 'round(AVG(total_tokens), 0)',
    total_tokens: 'SUM(total_tokens)',
    avg_success_score: 'round(AVG(success_score), 2)',
    avg_errors: 'round(AVG(error_count), 2)',
    total_errors: 'SUM(error_count)',
  };

  const metricExpression = metricExpressions[metric];
  if (!metricExpression) {
    throw new Error(`Invalid metric: ${metric}`);
  }

  // Map dimension to SQL expression (for computed dimensions)
  const dimensionExpressions: Record<string, string> = {
    used_skills: 'if(skills_count > 0, 1, 0)',
    used_slash_commands: 'if(slash_commands_count > 0, 1, 0)',
    used_subagents: 'if(subagents_count > 0, 1, 0)',
  };

  const dimensionExpression = dimensionExpressions[dimension] || dimension;
  const splitByExpression = split_by ? (dimensionExpressions[split_by] || split_by) : null;

  let filters = '';
  if (user_id) {
    filters += ` AND user_id = '${escapeString(user_id)}'`;
  }
  if (project_path) {
    filters += ` AND project_path = '${escapeString(project_path)}'`;
  }

  let query: string;

  if (split_by) {
    query = `
      SELECT
        ${dimensionExpression} as dimension_value,
        ${splitByExpression} as split_value,
        ${metricExpression} as metric_value
      FROM flick.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
      GROUP BY dimension_value, split_value
      ORDER BY metric_value DESC
    `;
  } else {
    query = `
      SELECT
        ${dimensionExpression} as dimension_value,
        ${metricExpression} as metric_value
      FROM flick.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
      GROUP BY dimension_value
      ORDER BY metric_value DESC
      LIMIT ${lim}
    `;
  }

  const results = await queryClickhouse<any>(query);

  if (split_by) {
    const grouped = new Map<string, Record<string, number>>();
    const totalMetric = new Map<string, number>();

    for (const row of results) {
      const dimVal = String(row.dimension_value);
      const splitVal = String(row.split_value);
      const metricVal = Number(row.metric_value);

      if (!grouped.has(dimVal)) {
        grouped.set(dimVal, {});
        totalMetric.set(dimVal, 0);
      }

      grouped.get(dimVal)![splitVal] = metricVal;
      totalMetric.set(dimVal, (totalMetric.get(dimVal) || 0) + metricVal);
    }

    const finalData = Array.from(grouped.entries())
      .map(([dimension_value, split_values]) => ({
        dimension_value,
        split_values,
        _total: totalMetric.get(dimension_value) || 0,
      }))
      .sort((a, b) => b._total - a._total)
      .slice(0, lim)
      .map(({ dimension_value, split_values }) => ({
        dimension_value,
        split_values,
      }));

    return finalData;
  }

  return results.map((row: any) => ({
    dimension_value: String(row.dimension_value),
    metric_value: Number(row.metric_value),
  }));
}

/**
 * Get detailed session information including conversation content
 */
export async function getSessionDetail(
  orgId: string,
  sessionId: string
): Promise<SessionDetail | null> {
  const org = escapeString(orgId);
  const sid = escapeString(sessionId);

  const query = `
    SELECT
      cs.session_id,
      cs.user_id,
      formatDateTime(cs.session_date, '%Y-%m-%d %H:%i:%S') as session_date,
      formatDateTime(cs.last_interaction_date, '%Y-%m-%d %H:%i:%S') as last_interaction_date,
      cs.project_path,
      cs.repository,
      cs.content,
      cs.subagents,
      cs.skills,
      cs.slash_commands,
      cs.git_branch,
      cs.git_sha,
      cs.total_tokens,
      cs.input_tokens,
      cs.output_tokens,
      sa.success_score,
      sa.actual_duration_min as duration_min,
      sa.total_interactions
    FROM flick.claude_sessions cs
    LEFT JOIN flick.session_analytics sa ON cs.session_id = sa.session_id
    WHERE cs.session_id = '${sid}'
      AND cs.organization_id = '${org}'
    ORDER BY cs.ingested_at DESC
    LIMIT 1
  `;

  const results = await queryClickhouse<SessionDetail>(query);

  if (results.length === 0) {
    return null;
  }

  const row = results[0]!;
  return {
    ...row,
    repository: row.repository || null,
    git_branch: row.git_branch || null,
    git_sha: row.git_sha || null,
  };
}
