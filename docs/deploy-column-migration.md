# Deployment Plan: Column Migration to MV-Computed Values

This plan covers migration `20260226054030_auto.sql`, which removes 8 columns from `claude_sessions` and moves their computation into the `session_analytics_mv` materialized view.

## What changed

**Columns removed from `claude_sessions`:**
- `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `total_tokens`
- `skills`, `slash_commands`, `subagent_types`

These values are now computed inside `session_analytics_mv` by parsing the raw JSONL `content` field using ClickHouse JSON/array functions and regex extraction.

**Ingest changes:**
- `session_date` and `last_interaction_date` are now extracted from actual JSONL timestamps at ingest time (not set to `now()`).
- `buildSessionRow` no longer writes token or skill columns.

## Prerequisites

- [ ] `bun run verify` passes
- [ ] PR merged to `main`

## Deployment steps

### Step 1: Apply migration to CI

```bash
cd packages/ch-schema
bun run ch:migrate -- --apply --allow-destructive
```

This drops the MV, drops the 8 columns from `claude_sessions`, and recreates the MV with the new query. Verify:

```bash
bun run ch:status
bun run chcli -- -q "DESCRIBE rudel.claude_sessions" -F pretty
bun run chcli -- -q "SHOW CREATE TABLE rudel.session_analytics_mv" -F pretty
```

Confirm that `claude_sessions` no longer has the dropped columns, and the MV query includes the new `_assistant_lines`, `_input_tokens`, `_skills`, etc. WITH clauses.

### Step 2: Apply migration to PRD

```bash
bun run ch:migrate:prd -- --apply --allow-destructive
```

Same verification:

```bash
bun run chcli:prd -- -q "DESCRIBE rudel.claude_sessions" -F pretty
```

### Step 3: Truncate `session_analytics` (both environments)

The existing rows in `session_analytics` were computed with the old MV logic, which read tokens/skills from the now-dropped columns (values were always 0/empty). These rows must be replaced.

```bash
bun run chcli -- -q "TRUNCATE TABLE rudel.session_analytics" -F pretty
bun run chcli:prd -- -q "TRUNCATE TABLE rudel.session_analytics" -F pretty
```

### Step 4: Backfill `session_analytics`

After the MV is recreated, new inserts into `claude_sessions` are handled automatically. But existing data needs to be replayed through the MV query.

The backfill plugin divides the time window into chunks (default 6 hours each), executes with per-chunk checkpointing, and supports resume on failure. The plugin uses the `session_date` column for time windowing, configured via `plugins.backfill.timeColumn` on the `claude_sessions` table definition.

```bash
# 1. Plan the backfill (generates a plan, does not execute)
bun run ch:backfill:plan -- --target rudel.session_analytics --from 2025-01-01 --to 2026-03-01

# 2. Inspect the plan output — check the generated SQL and chunk boundaries
#    Verify the WHERE clauses reference session_date
#    The plan ID is a 16-char hex string printed in the output

# 3. Execute
bun run ch:backfill:run -- --plan-id <plan-id>

# 4. Monitor
bun run ch:backfill:status -- --plan-id <plan-id>
```

For production:

```bash
bun run ch:backfill:plan:prd -- --target rudel.session_analytics --from 2025-01-01 --to 2026-03-01
bun run ch:backfill:run:prd -- --plan-id <plan-id>
bun run ch:backfill:status:prd -- --plan-id <plan-id>
```

The `--time-column session_date` CLI flag can also be used to explicitly override the time column, though this is handled automatically by the schema-level config.

### Step 5: Verify

```bash
# Row counts should match (minus rows filtered by WHERE length(_timestamps) > 0)
bun run chcli -- -q "SELECT count() FROM rudel.claude_sessions" -F pretty
bun run chcli -- -q "SELECT count() FROM rudel.session_analytics" -F pretty

# Spot-check that tokens are now populated (not all zeros)
bun run chcli -- -q "
  SELECT session_id, input_tokens, output_tokens, total_tokens,
         skills, slash_commands, subagent_types
  FROM rudel.session_analytics
  WHERE total_tokens > 0
  LIMIT 5
" -F pretty

# Same for PRD
bun run chcli:prd -- -q "SELECT count() FROM rudel.session_analytics" -F pretty
```

### Step 6: Deploy the API

Deploy the updated API with the simplified `buildSessionRow` and `extractTimestampRange`. Since the project is not heavily deployed yet, this can happen at any point — but ideally before or right after the migration so the ingest path matches the schema.

## How the MV + backfill interaction works

- **Materialized views are INSERT triggers.** They fire only on new `INSERT INTO claude_sessions`. They do not retroactively process existing rows.
- **The backfill replays the MV query** as a batch `INSERT INTO session_analytics SELECT ... FROM claude_sessions`. It uses the same SQL logic as the MV but executes it as a one-time operation over a time window.
- **After backfill**, the MV handles all future inserts automatically. No ongoing maintenance needed.
- **`session_analytics` uses `ReplacingMergeTree(ingested_at)`**, so if the same `session_id` is backfilled multiple times, ClickHouse deduplicates on merge (keeping the row with the latest `ingested_at`). This makes the backfill idempotent.

## Rollback

Since `claude_sessions` still has the `content` blob, no data is lost by dropping the computed columns. To rollback:

1. Re-add the columns to `claude_sessions` schema
2. Generate + apply a new migration
3. Re-ingest or backfill the column values

The `content` field is the source of truth — everything else is derived.
