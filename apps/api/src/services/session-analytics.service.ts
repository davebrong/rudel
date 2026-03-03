import type {
	DimensionAnalysisInput,
	SessionAnalytics,
	SessionAnalyticsSummary as SessionAnalyticsSummaryBase,
	SessionDetail,
} from "@rudel/api-routes";
import {
	buildDateFilter,
	escapeString,
	queryClickhouse,
} from "../clickhouse.js";

export interface SessionAnalyticsRaw {
	session_id: string;
	user_id: string;
	session_date: string;
	project_path: string;
	organization_id: string;
	git_remote: string;
	package_name: string;

	// Interaction timing metrics
	total_interactions: number;
	avg_period_sec: number;
	median_period_sec: number;
	quick_responses: number;
	normal_responses: number;
	long_pauses: number;
	actual_duration_min: number;

	// Duration metrics
	last_interaction_date: string;

	// Token metrics
	total_tokens: number;
	input_tokens: number;
	output_tokens: number;

	// Git activity
	git_sha: string;
	git_branch: string;
	has_commit: number;

	// Feature arrays
	subagent_types: string[];
	skills: string[];
	slash_commands: string[];

	// Success metrics
	session_archetype: string;
	success_score: number;

	// Effectiveness correlation factors
	error_count: number;
	model_used: string;
	used_plan_mode: number;
}

export interface SessionAnalyticsSummary extends SessionAnalyticsSummaryBase {
	total_interactions: number;
	avg_interactions_per_session: number;
	median_response_time_sec: number;
	quick_response_rate: number;
	long_pause_rate: number;
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
		sort_by?: "date" | "duration" | "interactions";
		sort_order?: "asc" | "desc";
	} = {},
): Promise<SessionAnalytics[]> {
	const {
		days = 30,
		user_id,
		project_path,
		repository,
		limit = 50,
		offset = 0,
		sort_by = "date",
		sort_order = "desc",
	} = params;

	const org = escapeString(orgId);
	const d = Number(days);
	const lim = Number(limit);
	const off = Number(offset);

	let filters = "";
	if (user_id) {
		filters += ` AND user_id = '${escapeString(user_id)}'`;
	}
	if (project_path) {
		filters += ` AND project_path = '${escapeString(project_path)}'`;
	}
	if (repository) {
		const escapedRepo = escapeString(repository);
		filters += ` AND (git_remote = '${escapedRepo}' OR package_name = '${escapedRepo}' OR project_path = '${escapedRepo}')`;
	}

	const sortColumn =
		sort_by === "duration"
			? "actual_duration_min"
			: sort_by === "interactions"
				? "total_interactions"
				: "sa.session_date";
	const sortDirection = sort_order === "asc" ? "ASC" : "DESC";

	const query = `
    SELECT
      session_id,
      user_id,
      formatDateTime(sa.session_date, '%Y-%m-%d %H:%i:%S') as session_date,
      project_path,
      organization_id,
      git_remote,
      package_name,
      total_interactions,
      avg_period_sec,
      median_period_sec,
      quick_responses,
      normal_responses,
      long_pauses,
      actual_duration_min,
      formatDateTime(sa.last_interaction_date, '%Y-%m-%d %H:%i:%S') as last_interaction_date,
      total_tokens,
      input_tokens,
      output_tokens,
      git_sha,
      git_branch,
      has_commit,
      subagent_types,
      skills,
      slash_commands,
      session_archetype,
      success_score,
      error_count,
      model_used,
      used_plan_mode
    FROM rudel.session_analytics sa
    WHERE ${buildDateFilter(d, "sa.session_date")}
      AND organization_id = '${org}'
      ${filters}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ${lim}
    OFFSET ${off}
  `;

	const raw = await queryClickhouse<SessionAnalyticsRaw>(query);

	return raw.map(
		(row): SessionAnalytics => ({
			session_id: row.session_id,
			user_id: row.user_id,
			session_date: row.session_date,
			project_path: row.project_path,
			repository:
				row.git_remote || row.package_name || row.project_path || null,
			git_remote: row.git_remote || undefined,
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
			model_used: row.model_used,
			used_plan_mode: row.used_plan_mode > 0,
		}),
	);
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
	} = {},
): Promise<SessionAnalyticsSummary> {
	const { days = 30, user_id, project_path } = params;
	const org = escapeString(orgId);
	const d = Number(days);

	let filters = "";
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
        ifNull(AVG(actual_duration_min), 0) as avg_duration,
        ifNull(AVG(total_interactions), 0) as avg_interactions,
        ifNull(AVG(avg_period_sec), 0) as avg_response,
        ifNull(AVG(median_period_sec), 0) as med_response,
        countIf(length(subagent_types) > 0) as cnt_subagents,
        countIf(length(skills) > 0) as cnt_skills,
        countIf(length(slash_commands) > 0) as cnt_slash
      FROM rudel.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      cnt_sessions as total_sessions,
      sum_interactions as total_interactions,
      ifNull(round(avg_duration, 2), 0) as avg_session_duration_min,
      ifNull(round(avg_interactions, 2), 0) as avg_interactions_per_session,
      ifNull(round(avg_response, 2), 0) as avg_response_time_sec,
      ifNull(round(med_response, 2), 0) as median_response_time_sec,
      round(sum_quick_responses * 100.0 / if(sum_interactions > 0, sum_interactions, 1), 2) as quick_response_rate,
      round(sum_long_pauses * 100.0 / if(sum_interactions > 0, sum_interactions, 1), 2) as long_pause_rate,
      round(cnt_subagents * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as subagents_adoption_rate,
      round(cnt_skills * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as skills_adoption_rate,
      round(cnt_slash * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as slash_commands_adoption_rate
    FROM totals
  `;

	const results = await queryClickhouse<SessionAnalyticsSummary>(query);

	const defaults: SessionAnalyticsSummary = {
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

	if (results.length === 0) {
		return defaults;
	}

	// Coalesce nulls from ClickHouse (AVG on 0 rows returns null despite ifNull)
	const row = results[0] as Record<string, unknown> | undefined;
	if (!row) return defaults;
	return Object.fromEntries(
		Object.entries(defaults).map(([key, def]) => [key, row[key] ?? def]),
	) as SessionAnalyticsSummary;
}

export type SessionSummaryComparisonPeriod = SessionAnalyticsSummaryBase;

/**
 * Get session analytics summary with period-over-period comparison
 */
export async function getSessionAnalyticsSummaryComparison(
	orgId: string,
	params: {
		days?: number;
		user_id?: string;
		project_path?: string;
	} = {},
) {
	const { days = 7, user_id, project_path } = params;
	const org = escapeString(orgId);
	const d = Number(days);
	const previousDays = d * 2;

	let filters = "";
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
        ifNull(AVG(actual_duration_min), 0) as avg_duration,
        ifNull(AVG(avg_period_sec), 0) as avg_response,
        countIf(length(subagent_types) > 0) as cnt_subagents,
        countIf(length(skills) > 0) as cnt_skills,
        countIf(length(slash_commands) > 0) as cnt_slash
      FROM rudel.session_analytics
      WHERE ${dateCondition}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      cnt_sessions as total_sessions,
      ifNull(round(avg_duration, 2), 0) as avg_session_duration_min,
      ifNull(round(avg_response, 2), 0) as avg_response_time_sec,
      round(cnt_subagents * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as subagents_adoption_rate,
      round(cnt_skills * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as skills_adoption_rate,
      round(cnt_slash * 100.0 / if(cnt_sessions > 0, cnt_sessions, 1), 2) as slash_commands_adoption_rate
    FROM totals
  `;

	const currentQuery = summarySQL(buildDateFilter(d));
	const previousQuery = summarySQL(
		`session_date >= now64(3) - INTERVAL ${previousDays} DAY AND session_date < now64(3) - INTERVAL ${d} DAY`,
	);

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

	// Coalesce nulls from ClickHouse (AVG on 0 rows returns null despite ifNull)
	const coalesce = (
		row: SessionSummaryComparisonPeriod | undefined,
	): SessionSummaryComparisonPeriod => {
		if (!row) return { ...defaultPeriod };
		return Object.fromEntries(
			Object.entries(defaultPeriod).map(([key, def]) => [
				key,
				(row as unknown as Record<string, unknown>)[key] ?? def,
			]),
		) as SessionSummaryComparisonPeriod;
	};
	const current = coalesce(currentData[0]);
	const previous = coalesce(previousData[0]);

	const calculateChange = (curr: number, prev: number) => {
		if (!prev || prev === 0) return 0;
		return ((curr - prev) / prev) * 100;
	};

	const changes = {
		total_sessions: calculateChange(
			current.total_sessions || 0,
			previous.total_sessions || 0,
		),
		avg_session_duration_min: calculateChange(
			current.avg_session_duration_min || 0,
			previous.avg_session_duration_min || 0,
		),
		avg_response_time_sec: calculateChange(
			current.avg_response_time_sec || 0,
			previous.avg_response_time_sec || 0,
		),
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
	} = {},
): Promise<Array<{ bucket: string; count: number; percentage: number }>> {
	const { days = 30, user_id, project_path } = params;
	const org = escapeString(orgId);
	const d = Number(days);

	let filters = "";
	if (user_id) {
		filters += ` AND user_id = '${escapeString(user_id)}'`;
	}
	if (project_path) {
		filters += ` AND project_path = '${escapeString(project_path)}'`;
	}

	const query = `
    WITH total AS (
      SELECT SUM(total_interactions) as total_count
      FROM rudel.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
    )
    SELECT
      'Instant (< 5s)' as bucket,
      SUM(quick_responses) as count,
      round(SUM(quick_responses) * 100.0 / (SELECT total_count FROM total), 2) as percentage
    FROM rudel.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}

    UNION ALL

    SELECT
      'Normal (5-60s)' as bucket,
      SUM(normal_responses) as count,
      round(SUM(normal_responses) * 100.0 / (SELECT total_count FROM total), 2) as percentage
    FROM rudel.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}

    UNION ALL

    SELECT
      'Long Pause (> 5m)' as bucket,
      SUM(long_pauses) as count,
      round(SUM(long_pauses) * 100.0 / (SELECT total_count FROM total), 2) as percentage
    FROM rudel.session_analytics
    WHERE ${buildDateFilter(d)}
      AND organization_id = '${org}'
      ${filters}

    ORDER BY count DESC
  `;

	return queryClickhouse<{ bucket: string; count: number; percentage: number }>(
		query,
	);
}

/**
 * Get flexible dimension analysis with optional split-by for stacked charts
 */

// Map metric to SQL expression
const METRIC_EXPRESSIONS: Record<DimensionAnalysisInput["metric"], string> = {
	session_count: "COUNT(*)",
	avg_duration: "round(AVG(actual_duration_min), 2)",
	total_duration: "round(SUM(actual_duration_min) / 60, 2)",
	avg_interactions: "round(AVG(total_interactions), 2)",
	total_interactions: "SUM(total_interactions)",
	avg_response_time: "round(AVG(avg_period_sec), 2)",
	median_response_time: "round(AVG(median_period_sec), 2)",
	avg_tokens: "round(AVG(total_tokens), 0)",
	total_tokens: "SUM(total_tokens)",
	avg_success_score: "round(AVG(success_score), 2)",
	avg_errors: "round(AVG(error_count), 2)",
	total_errors: "SUM(error_count)",
};

export async function getSessionDimensionAnalysis(
	orgId: string,
	params: {
		days?: number;
		dimension: DimensionAnalysisInput["dimension"];
		metric: DimensionAnalysisInput["metric"];
		split_by?: DimensionAnalysisInput["dimension"];
		limit?: number;
		user_id?: string;
		project_path?: string;
	},
) {
	const {
		days = 7,
		dimension,
		metric,
		split_by,
		limit = 10,
		user_id,
		project_path,
	} = params;
	const org = escapeString(orgId);
	const d = Number(days);
	const lim = Number(limit);

	const metricExpression = METRIC_EXPRESSIONS[metric];

	// Map dimension to SQL expression (for computed dimensions)
	const dimensionExpressions: Record<string, string> = {
		repository:
			"if(git_remote != '', git_remote, if(package_name != '', package_name, project_path))",
		used_skills: "if(length(skills) > 0, 1, 0)",
		used_slash_commands: "if(length(slash_commands) > 0, 1, 0)",
		used_subagents: "if(length(subagent_types) > 0, 1, 0)",
	};

	const dimensionExpression = dimensionExpressions[dimension] || dimension;
	const splitByExpression = split_by
		? dimensionExpressions[split_by] || split_by
		: null;

	let filters = "";
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
      FROM rudel.session_analytics
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
      FROM rudel.session_analytics
      WHERE ${buildDateFilter(d)}
        AND organization_id = '${org}'
        ${filters}
      GROUP BY dimension_value
      ORDER BY metric_value DESC
      LIMIT ${lim}
    `;
	}

	interface DimensionRow {
		dimension_value: string;
		split_value?: string;
		metric_value: number;
	}

	const results = await queryClickhouse<DimensionRow>(query);

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

			const group = grouped.get(dimVal);
			if (group) group[splitVal] = metricVal;
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

	return results.map((row) => ({
		dimension_value: String(row.dimension_value),
		metric_value: Number(row.metric_value),
	}));
}

/**
 * Get detailed session information including conversation content
 */
export async function getSessionDetail(
	orgId: string,
	sessionId: string,
): Promise<SessionDetail | null> {
	const org = escapeString(orgId);
	const sid = escapeString(sessionId);

	const query = `
    SELECT
      session_id,
      user_id,
      formatDateTime(sa.session_date, '%Y-%m-%d %H:%i:%S') as session_date,
      formatDateTime(sa.last_interaction_date, '%Y-%m-%d %H:%i:%S') as last_interaction_date,
      project_path,
      if(git_remote != '', git_remote, if(package_name != '', package_name, project_path)) as repository,
      content,
      subagents,
      skills,
      slash_commands,
      git_branch,
      git_sha,
      total_tokens,
      input_tokens,
      output_tokens,
      success_score,
      actual_duration_min as duration_min,
      total_interactions,
      session_archetype,
      model_used
    FROM rudel.session_analytics sa
    WHERE session_id = '${sid}'
      AND organization_id = '${org}'
    ORDER BY ingested_at DESC
    LIMIT 1
  `;

	const results = await queryClickhouse<SessionDetail>(query);

	const [row] = results;
	if (!row) {
		return null;
	}
	return {
		...row,
		repository: row.repository || null,
		git_branch: row.git_branch || null,
		git_sha: row.git_sha || null,
	};
}
