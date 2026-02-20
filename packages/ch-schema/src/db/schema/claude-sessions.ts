import { schema, table } from "@chkit/core";

const rudel_claude_sessions = table({
	database: "rudel",
	name: "claude_sessions",
	engine: "SharedReplacingMergeTree(ingested_at)",
	columns: [
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
		{ name: "subagents", type: "Map(String, String)", default: "fn:map()" },
		{ name: "skills", type: "Array(String)", default: "fn:[]" },
		{ name: "slash_commands", type: "Array(String)", default: "fn:[]" },
		{ name: "subagent_types", type: "Array(String)", default: "fn:[]" },
		{
			name: "ingested_at",
			type: "DateTime64(3, 'UTC')",
			default: "fn:now64(3)",
		},
		{ name: "user_id", type: "String" },
		{ name: "git_branch", type: "String", nullable: true },
		{ name: "git_sha", type: "String", nullable: true },
		{ name: "input_tokens", type: "UInt64", default: "fn:0" },
		{ name: "output_tokens", type: "UInt64", default: "fn:0" },
		{ name: "cache_read_input_tokens", type: "UInt64", default: "fn:0" },
		{ name: "cache_creation_input_tokens", type: "UInt64", default: "fn:0" },
		{ name: "total_tokens", type: "UInt64", default: "fn:0" },
		{ name: "tag", type: "String", nullable: true },
	],
	primaryKey: [],
	orderBy: ["organization_id", "session_date", "session_id"],
	partitionBy: "toYYYYMM(toDate(session_date))",
	ttl: "toDate(session_date) + toIntervalDay(365)",
	settings: {
		index_granularity: "8192",
		storage_policy: "'s3'",
	},
});

export default schema(rudel_claude_sessions);
