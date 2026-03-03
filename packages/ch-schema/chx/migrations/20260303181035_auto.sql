-- chkit-migration-format: v1
-- generated-at: 2026-03-03T18:10:35.114Z
-- cli-version: 0.1.0-beta.15
-- definition-count: 5
-- operation-count: 4
-- rename-suggestion-count: 0
-- risk-summary: safe=0, caution=1, danger=3

-- operation: alter_table_drop_column key=table:rudel.claude_sessions:column:repository risk=danger
ALTER TABLE rudel.claude_sessions DROP COLUMN IF EXISTS `repository`;

-- operation: alter_table_drop_column key=table:rudel.codex_sessions:column:repository risk=danger
ALTER TABLE rudel.codex_sessions DROP COLUMN IF EXISTS `repository`;

-- operation: alter_table_drop_column key=table:rudel.session_analytics:column:repository risk=danger
ALTER TABLE rudel.session_analytics DROP COLUMN IF EXISTS `repository`;

-- operation: alter_table_drop_index key=table:rudel.session_analytics:index:idx_repository risk=caution
ALTER TABLE rudel.session_analytics DROP INDEX IF EXISTS `idx_repository`;
