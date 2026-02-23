import {
	buildDateFilter,
	escapeString,
	queryClickhouse,
} from "../clickhouse.js";

export interface UserMapping {
	user_id: string;
	username: string;
	session_count: number;
}

/**
 * Extract username from project path
 * Pattern: /Users/{username}/... or /home/{username}/...
 */
function extractUsernameFromPath(projectPath: string): string | null {
	const match = projectPath.match(/^\/(?:Users|home)\/([^/]+)\//);
	return match ? (match[1] ?? null) : null;
}

/**
 * Get user ID to username mappings by extracting usernames from project paths
 */
export async function getUserMappings(
	orgId: string,
	days = 30,
): Promise<UserMapping[]> {
	const org = escapeString(orgId);
	const dateFilter = buildDateFilter(days);

	const query = `
    SELECT
      user_id,
      project_path,
      count() as sessions
    FROM rudel.session_analytics
    WHERE ${dateFilter}
      AND organization_id = '${org}'
    GROUP BY user_id, project_path
    ORDER BY user_id, sessions DESC
  `;

	const results = await queryClickhouse<{
		user_id: string;
		project_path: string;
		sessions: number;
	}>(query);

	// Group by user_id and extract the most common username
	const userMap = new Map<
		string,
		{ username: string | null; totalSessions: number }
	>();

	for (const row of results) {
		const username = extractUsernameFromPath(row.project_path);

		if (!userMap.has(row.user_id)) {
			userMap.set(row.user_id, { username, totalSessions: row.sessions });
		} else {
			const existing = userMap.get(row.user_id);
			if (!existing) continue;
			if (username && row.sessions > existing.totalSessions) {
				existing.username = username;
				existing.totalSessions = row.sessions;
			}
		}
	}

	const mappings: UserMapping[] = [];
	for (const [user_id, data] of userMap.entries()) {
		if (data.username) {
			mappings.push({
				user_id,
				username: data.username,
				session_count: data.totalSessions,
			});
		}
	}

	return mappings.sort((a, b) => b.session_count - a.session_count);
}

/**
 * Get a single user mapping by user_id
 */
export async function getUserMapping(
	orgId: string,
	userId: string,
	days = 30,
): Promise<UserMapping | null> {
	const org = escapeString(orgId);
	const uid = escapeString(userId);
	const dateFilter = buildDateFilter(days);

	const query = `
    SELECT
      user_id,
      project_path,
      count() as sessions
    FROM rudel.session_analytics
    WHERE ${dateFilter}
      AND organization_id = '${org}'
      AND user_id = '${uid}'
    GROUP BY user_id, project_path
    ORDER BY sessions DESC
    LIMIT 1
  `;

	const results = await queryClickhouse<{
		user_id: string;
		project_path: string;
		sessions: number;
	}>(query);

	const [row] = results;
	if (!row) {
		return null;
	}
	const username = extractUsernameFromPath(row.project_path);

	if (!username) {
		return null;
	}

	return {
		user_id: row.user_id,
		username,
		session_count: row.sessions,
	};
}
