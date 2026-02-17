-- chx-migration-format: v1
-- generated-at: 2026-02-13T09:24:27.180Z
-- cli-version: 0.1.0
-- definition-count: 2
-- operation-count: 3
-- rename-suggestion-count: 0
-- risk-summary: safe=3, caution=0, danger=0

-- operation: create_database key=database:flick risk=safe
CREATE DATABASE IF NOT EXISTS flick;

-- operation: create_table key=table:flick.claude_sessions risk=safe
CREATE TABLE IF NOT EXISTS flick.claude_sessions
(
  `session_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `last_interaction_date` DateTime64(3, 'UTC') DEFAULT now64(3),
  `session_id` String,
  `organization_id` String,
  `project_path` String,
  `repository` Nullable(String),
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
  `tag` Nullable(String)
) ENGINE = SharedReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(toDate(session_date))
PRIMARY KEY ()
ORDER BY (`organization_id`, `session_date`, `session_id`)
TTL toDate(session_date) + toIntervalDay(365)
SETTINGS index_granularity = 8192, storage_policy = 's3';

-- operation: create_table key=table:flick.uptime_check_results risk=safe
CREATE TABLE IF NOT EXISTS flick.uptime_check_results
(
  `check_date` Date DEFAULT toDate(check_timestamp),
  `check_timestamp` DateTime64(3, 'UTC'),
  `monitor_id` String,
  `organization_id` String,
  `success` UInt8,
  `status_code` Nullable(UInt16),
  `response_time_ms` Nullable(UInt32),
  `status_valid` Nullable(UInt8),
  `body_valid` Nullable(UInt8),
  `timeout_occurred` UInt8 DEFAULT 0,
  `error_type` LowCardinality(Nullable(String)),
  `error_message` Nullable(String),
  `response_body` Nullable(String),
  `response_size_bytes` Nullable(UInt32),
  `content_type` LowCardinality(Nullable(String)),
  `worker_colo` LowCardinality(Nullable(String)),
  `check_attempt` UInt8 DEFAULT 1,
  `monitor_url` String,
  `monitor_method` LowCardinality(String),
  `expected_status_codes` Nullable(String),
  `check_interval_seconds` UInt32,
  `response_headers` Nullable(String),
  `retries_needed` UInt8 DEFAULT 0
) ENGINE = SharedMergeTree
PARTITION BY toYYYYMM(check_date)
PRIMARY KEY ()
ORDER BY (`organization_id`, `monitor_id`, `check_timestamp`)
TTL check_timestamp + toIntervalDay(30)
SETTINGS index_granularity = 8192, merge_selecting_sleep_ms = 500, min_parts_to_merge_at_once = 2, storage_policy = 's3';
