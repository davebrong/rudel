import type { ColumnDefinition } from "@chkit/core";

export const baseSessionColumns: ColumnDefinition[] = [
	{
		name: "session_date",
		type: "DateTime64(3, 'UTC')",
		default: "fn:now64(3)",
	},
	{
		name: "last_interaction_date",
		type: "DateTime64(3, 'UTC')",
		default: "fn:now64(3)",
	},
	{ name: "session_id", type: "String" },
	{ name: "organization_id", type: "String" },
	{ name: "project_path", type: "String" },
	{ name: "repository", type: "String", nullable: true },
	{ name: "content", type: "String" },
	{
		name: "ingested_at",
		type: "DateTime64(3, 'UTC')",
		default: "fn:now64(3)",
	},
	{ name: "user_id", type: "String" },
	{ name: "git_branch", type: "String", nullable: true },
	{ name: "git_sha", type: "String", nullable: true },
	{ name: "tag", type: "String", nullable: true },
];

export const baseSessionTableConfig = {
	primaryKey: [] as string[],
	orderBy: ["organization_id", "session_date", "session_id"],
	partitionBy: "toYYYYMM(toDate(session_date))",
	ttl: "toDate(session_date) + toIntervalDay(365)",
	settings: {
		index_granularity: "8192" as const,
		storage_policy: "'s3'" as const,
	},
};
