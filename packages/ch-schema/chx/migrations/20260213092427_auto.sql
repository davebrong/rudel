-- chx-migration-format: v1
-- generated-at: 2026-02-13T09:24:27.180Z
-- cli-version: 0.1.0
-- definition-count: 1
-- operation-count: 2
-- rename-suggestion-count: 0
-- risk-summary: safe=2, caution=0, danger=0

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
