-- chkit-migration-format: v1
-- generated-at: 2026-03-02T05:18:14.696Z
-- cli-version: 0.1.0-beta.15
-- definition-count: 3
-- operation-count: 5
-- rename-suggestion-count: 0
-- risk-summary: safe=4, caution=1, danger=0

-- operation: alter_table_add_column key=table:rudel.claude_sessions:column:git_remote risk=safe
ALTER TABLE rudel.claude_sessions ADD COLUMN IF NOT EXISTS `git_remote` String DEFAULT '''''';

-- operation: alter_table_add_column key=table:rudel.claude_sessions:column:package_name risk=safe
ALTER TABLE rudel.claude_sessions ADD COLUMN IF NOT EXISTS `package_name` String DEFAULT '''''';

-- operation: alter_table_add_column key=table:rudel.session_analytics:column:git_remote risk=safe
ALTER TABLE rudel.session_analytics ADD COLUMN IF NOT EXISTS `git_remote` String DEFAULT '''''';

-- operation: alter_table_add_column key=table:rudel.session_analytics:column:package_name risk=safe
ALTER TABLE rudel.session_analytics ADD COLUMN IF NOT EXISTS `package_name` String DEFAULT '''''';

-- operation: alter_table_add_index key=table:rudel.session_analytics:index:idx_git_remote risk=caution
ALTER TABLE rudel.session_analytics ADD INDEX IF NOT EXISTS `idx_git_remote` (git_remote) TYPE set(0) GRANULARITY 4;
