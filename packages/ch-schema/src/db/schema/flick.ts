import { schema, table } from "@chkit/core";

const flick_uptime_check_results = table({
	database: "flick",
	name: "uptime_check_results",
	engine: "SharedMergeTree",
	columns: [
		{ name: "check_date", type: "Date", default: "fn:toDate(check_timestamp)" },
		{ name: "check_timestamp", type: "DateTime64(3, 'UTC')" },
		{ name: "monitor_id", type: "String" },
		{ name: "organization_id", type: "String" },
		{ name: "success", type: "UInt8" },
		{ name: "status_code", type: "UInt16", nullable: true },
		{ name: "response_time_ms", type: "UInt32", nullable: true },
		{ name: "status_valid", type: "UInt8", nullable: true },
		{ name: "body_valid", type: "UInt8", nullable: true },
		{ name: "timeout_occurred", type: "UInt8", default: "fn:0" },
		{ name: "error_type", type: "LowCardinality(Nullable(String))" },
		{ name: "error_message", type: "String", nullable: true },
		{ name: "response_body", type: "String", nullable: true },
		{ name: "response_size_bytes", type: "UInt32", nullable: true },
		{ name: "content_type", type: "LowCardinality(Nullable(String))" },
		{ name: "worker_colo", type: "LowCardinality(Nullable(String))" },
		{ name: "check_attempt", type: "UInt8", default: "fn:1" },
		{ name: "monitor_url", type: "String" },
		{ name: "monitor_method", type: "LowCardinality(String)" },
		{ name: "expected_status_codes", type: "String", nullable: true },
		{ name: "check_interval_seconds", type: "UInt32" },
		{ name: "response_headers", type: "String", nullable: true },
		{ name: "retries_needed", type: "UInt8", default: "fn:0" },
	],
	primaryKey: [],
	orderBy: ["organization_id, monitor_id, check_timestamp"],
	partitionBy: "toYYYYMM(check_date)",
	ttl: "check_timestamp + toIntervalDay(30)",
	settings: {
		index_granularity: "8192",
		merge_selecting_sleep_ms: "500",
		min_parts_to_merge_at_once: "2",
		storage_policy: "'s3'",
	},
});

export default schema(flick_uptime_check_results);
