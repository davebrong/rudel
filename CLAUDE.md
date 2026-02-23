# Rudel

A platform for ingesting, storing, and analyzing Claude Code session transcripts. Users authenticate via the web app, use the CLI to upload `.jsonl` session transcripts, which are stored in ClickHouse for analytics.

**Stack**: Bun, Turborepo, Biome, TypeScript
**Deployment**: Bun server + Postgres (Neon) + ClickHouse
**Domain**: `app.rudel.ai`

## Monorepo Structure

### Apps

| App | Package | Description |
|-----|---------|-------------|
| `apps/api` | `@rudel/api` | HTTP API server (Bun). Auth via `better-auth`, RPC via `@orpc/server`, session ingestion into ClickHouse. |
| `apps/cli` | `rudel` (npm) | CLI tool for authenticating and uploading Claude Code session transcripts. Commands: `login`, `logout`, `whoami`, `upload`. |
| `apps/web` | `@rudel/web` | React SPA (Vite + Tailwind + shadcn). Auth UI and CLI login portal. |

### Packages

| Package | Description |
|---------|-------------|
| `packages/api-routes` (`@rudel/api-routes`) | Shared RPC contract (`@orpc/contract` + Zod schemas). Single source of truth for the API interface. |
| `packages/ch-schema` (`@rudel/ch-schema`) | ClickHouse table schema (`rudel.claude_sessions`, `rudel.session_analytics`), generated TypeScript types, and ingest functions via `chkit`. |
| `packages/sql-schema` (`@rudel/sql-schema`) | Drizzle ORM schema for Postgres auth tables (`user`, `session`, `account`, `verification`). |
| `packages/typescript-config` (`@rudel/typescript-config`) | Shared `tsconfig` base files (`base.json`, `node.json`, `react-library.json`). |

### Dependency Graph

```
@rudel/typescript-config ← (devDep) all packages and apps
@rudel/api-routes        ← @rudel/api, @rudel/web, rudel CLI
@rudel/sql-schema        ← @rudel/api
@rudel/ch-schema         ← @rudel/api
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PG_CONNECTION_STRING` | Yes | Postgres connection string (e.g. `postgres://postgres:postgres@localhost:5432/rudel`) |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (generate with `openssl rand -base64 32`) |
| `CLICKHOUSE_URL` | Yes | ClickHouse HTTP endpoint |
| `CLICKHOUSE_USERNAME` | No | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | No | ClickHouse password |
| `CLICKHOUSE_DB` | No | ClickHouse database name |
| `APP_URL` | No | API base URL (default: `http://localhost:4010`) |
| `ALLOWED_ORIGIN` | No | CORS origin (default: `http://localhost:4011`) |

## Local Development

There are two ways to run the app locally:

### 1. Standalone (local infra)

Uses Docker containers for Postgres and ClickHouse. No Doppler or external accounts required. Good for working on auth, UI, or API logic without needing real data.

**Prerequisites**: Docker (or [OrbStack](https://orbstack.dev)) must be installed and running.

```bash
bun install
bun run dev:local
```

This runs `scripts/dev-local.sh`, which:
1. Starts local Postgres + ClickHouse via Docker Compose (`docker compose up -d --wait`)
2. Runs Postgres migrations
3. Launches the API (`:4010`) and web app (`:4011`) in parallel

Open **http://localhost:4011** in your browser. Sign up with email/password to create a local account. Social login (Google/GitHub) is not available in this mode since there are no OAuth client credentials.

Environment is hardcoded in the script: local Postgres (`postgres://postgres:postgres@localhost:5432/rudel`), local ClickHouse (`http://localhost:8123`, password: `clickhouse`), and a static auth secret.

Manage containers separately: `bun run infra:up` / `bun run infra:down`. To wipe all data and start fresh: `docker compose down -v`.

### 2. Dev (production databases)

Connects to production Neon Postgres and ObsessionDB ClickHouse via the `prd_local` Doppler config. Runs API + web locally but with real data. Requires Doppler access.

```bash
bun install

# Terminal 1: API
doppler run --project rudel --config prd_local -- bun --watch apps/api/src/index.ts

# Terminal 2: Web
bun run --cwd apps/web dev
```

The `prd_local` Doppler config sets `APP_URL=http://localhost:4010` and `ALLOWED_ORIGIN=http://localhost:4011` so it routes to local servers, but `PG_CONNECTION_STRING` and `CLICKHOUSE_*` vars point to production databases. GitHub OAuth is configured in this mode (`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` are set).

The web app's Vite config proxies `/api` and `/rpc` requests to `http://localhost:4010`, so the web dev server only needs to be started with `bun run --cwd apps/web dev` (no Doppler needed for the frontend).

Alternatively, the API has a convenience script:

```bash
bun run --cwd apps/api dev:env
```

This runs `doppler run --project rudel --config prd_local -- bun --watch src/index.ts`.

## Self-Hosting

See [docs/self-hosting.md](docs/self-hosting.md) for deploying with ObsessionDB + Neon + Fly.io.

## Secrets Management (Doppler)

This project uses Doppler for secrets. Project: `rudel`.

| Config | Database | Use for |
|--------|----------|---------|
| `prd` | Production | ClickHouse queries, data exploration, deployed app |
| `prd_local` | Production | Local dev with real data (localhost URLs, production databases) |
| `ci` | CI/test | Running tests locally (`bun run verify`) |

### Injecting secrets

```bash
# Production (app, queries)
doppler run --project rudel --config prd -- <command>

# CI/test (local tests)
doppler run --project rudel --config ci -- <command>
```

### ClickHouse CLI (chcli)

chcli (`@obsessiondb/chcli`) is installed as a local devDependency in `packages/ch-schema` and optionally globally (`npm install -g @obsessiondb/chcli`).

**Env var mapping required.** Doppler provides `CLICKHOUSE_URL` and `CLICKHOUSE_USERNAME`, but chcli expects different env var names. The `chcli` and `chcli:prd` scripts in `packages/ch-schema/package.json` handle this mapping automatically:

| Doppler var | chcli var | Transformation |
|---|---|---|
| `CLICKHOUSE_URL` | `CLICKHOUSE_HOST` | Strip `https://` prefix |
| `CLICKHOUSE_USERNAME` | `CLICKHOUSE_USER` | Same value, different name |
| (not in Doppler) | `CLICKHOUSE_SECURE` | Must be `true` (not `1`) |
| (not in Doppler) | `CLICKHOUSE_PORT` | `443` (behind reverse proxy, not default 8123) |
| `CLICKHOUSE_PASSWORD` | `CLICKHOUSE_PASSWORD` | No mapping needed |

```bash
# From packages/ch-schema:
bun run chcli -- -q "SELECT 1" -F json        # CI
bun run chcli:prd -- -q "SHOW TABLES" -F json  # PRD
```

## ClickHouse Schema Management (chkit)

Schema definitions live in `packages/ch-schema/src/db/schema/*.ts`. The toolkit `chkit` generates SQL migrations, applies them, and produces TypeScript codegen.

**Important**: chkit must run with `bun --bun` (not plain `bun`) because the `.exe` spawns Node.js which cannot load `.ts` config files. All scripts below already handle this.

**Important**: Doppler sets `CLICKHOUSE_DB=rudel`, but chkit needs to connect to `default` first (to run `CREATE DATABASE`). The `ch:migrate` scripts override this with `CLICKHOUSE_DB=default`. The `ch:generate` and `ch:codegen` scripts don't need the override since they don't connect to ClickHouse or only read schema files.

### Workflow

All commands run from `packages/ch-schema`:

```bash
# 1. Edit schema in src/db/schema/*.ts

# 2. Preview what migration will be generated (no files written)
bun run ch:generate:dryrun

# 3. Generate migration SQL + update snapshot/journal
bun run ch:generate

# 4. Apply pending migrations to CI ClickHouse
bun run ch:migrate

# 5. Apply pending migrations to PRD ClickHouse
bun run ch:migrate:prd

# 6. Regenerate TypeScript types from schema
bun run ch:codegen

# 7. Check migration status
bun run ch:status

# 8. Check schema drift (snapshot vs live ClickHouse)
bun run ch:drift
```

### Ad-hoc ClickHouse queries (chcli)

`chcli` is the preferred tool for ad-hoc queries. It supports `-q` (inline SQL), `-f` (SQL file), and various output formats (`-F json`, `-F pretty`, `-F csv`, etc.).

```bash
# Inline query against CI
bun run chcli -- -q "SELECT count() FROM rudel.session_analytics" -F pretty

# Run a SQL file against CI
bun run chcli -- -f scripts/backfill.sql -v

# Query PRD
bun run chcli:prd -- -q "SHOW TABLES FROM rudel" -F pretty
```

The `ch:query` and `ch:describe` scripts use raw curl and are kept as fallbacks:

```bash
bun run ch:query scripts/my_query.sql
bun run ch:describe rudel.claude_sessions
```

### Resetting from scratch

To drop everything and recreate:

1. Drop the database via `ch:query` or curl
2. Delete `chx/migrations/`, reset `chx/meta/journal.json` to `{"version":1,"applied":[]}`, reset `chx/meta/snapshot.json` to `{"version":1,"generatedAt":"","definitions":[]}`
3. Run `bun run ch:generate` to create a fresh migration from current schema (codegen plugin may fail — ignore, migration file is still created)
4. **Manually reorder** the migration SQL: database -> tables -> materialized views (see known issues below)
5. Wait ~8s after dropping (ClickHouse Cloud propagation delay), then run `bun run ch:migrate`

### Known issues and blockers

**chkit generates operations in wrong order.** Materialized views are emitted before the tables they depend on. After `ch:generate`, always manually reorder the migration file so CREATE TABLE statements come before CREATE MATERIALIZED VIEW. This is a chkit bug.

**No SQL `--` comments inside MV `as` clauses.** chkit flattens the multi-line MV query into a single line. SQL `--` comments become inline on that line and comment out everything after them, breaking the query. Never use `--` comments inside the `as:` template string in `materializedView()` definitions. Use TypeScript comments (`//`) outside the template string if needed.

**`primaryKey: []` is required** by chkit's `TableDefinition` type, even though ClickHouse defaults the primary key to ORDER BY columns. chkit emits `PRIMARY KEY ()` in the DDL. This is safe to leave or remove from the migration file — it's cosmetic.

**ClickHouse Cloud propagation delay.** After DROP DATABASE, the database may still appear in SHOW DATABASES for several seconds. Similarly, after CREATE TABLE, the table may not be immediately available for CREATE MATERIALIZED VIEW. Wait ~8s between DROP and re-apply.

**Codegen plugin failure.** `bun run ch:generate` may fail with `Plugin "codegen" failed in generate integration with exit code 1`. The migration file and snapshot are still created despite this error. Run `bun run ch:codegen` separately if needed.

**`CLICKHOUSE_DB=default` override.** Doppler sets `CLICKHOUSE_DB=rudel`. When the `rudel` database doesn't exist yet (e.g., during initial migration), chkit fails to connect. The `ch:migrate` script overrides this with `CLICKHOUSE_DB=default` inside a bash subshell so the override happens after Doppler injects env vars.

**ClickHouse Cloud silent INSERT behavior.** `INSERT ... SELECT` via the HTTP interface may silently return 200 with 0 rows written. Use `SETTINGS async_insert=0` as a workaround. Additionally, `INSERT INTO table_x SELECT ... FROM table_x` (same source and target table) silently writes 0 rows even with `async_insert=0` — you must read from a different source table. The API uses `client.command()` with `FORMAT JSONEachRow` and `async_insert=0` (see `apps/api/src/clickhouse.ts`).

**Codegen EPERM on Windows.** `bun run ch:codegen` may fail with `EPERM: operation not permitted, rename .tmp -> chkit-types.ts` when VSCode has the file open. Workaround: close the file in the editor, or manually copy the `.tmp` file content over `chkit-types.ts` and delete the `.tmp` files.

**INSERT INTO with SELECT * column mismatch.** When backfilling `session_analytics` from `claude_sessions`, ClickHouse matches INSERT columns by position, not name. Since the MV computes columns in a different order than the table definition, always use an explicit column list in the INSERT INTO clause. See `scripts/backfill.sql` for the working example.

**`bun run` resolves binaries from local `node_modules/.bin/`, not global PATH.** When running package.json scripts, `bun run` looks for binaries in `node_modules/.bin/` first. If a tool like `chcli` is only installed globally, `bun run` won't find it. Fix: add the tool as a local devDependency (e.g., `@obsessiondb/chcli` in `packages/ch-schema`). Bun also rewrites `npx` to `bun x` in scripts, which has the same local-first resolution behavior.

**chcli env var mapping.** Doppler provides `CLICKHOUSE_URL` (e.g., `https://host.example.com`) and `CLICKHOUSE_USERNAME`, but chcli expects `CLICKHOUSE_HOST` (hostname only), `CLICKHOUSE_USER`, `CLICKHOUSE_SECURE=true`, and `CLICKHOUSE_PORT=443`. The `chcli`/`chcli:prd` scripts in `packages/ch-schema/package.json` handle this mapping via `bash -c` with shell parameter expansion (`${CLICKHOUSE_URL#https://}`).

**`CLICKHOUSE_SECURE` must be the string `true`, not `1`.** chcli does not recognize `1` or other truthy values for `CLICKHOUSE_SECURE`. Always use `CLICKHOUSE_SECURE=true`.

**ClickHouse is on port 443, not 8123/8443.** The ClickHouse instance is behind a reverse proxy serving HTTPS on port 443. The default ClickHouse ports (8123 HTTP, 8443 HTTPS) are not open.

**Broken global npm `bun` shim on Windows.** If `npm install -g bun` was run previously, it creates a broken shim at `$APPDATA/npm/bun` that shadows the real bun at `~/.bun/bin/bun`. This breaks any globally installed tool that uses `#!/usr/bin/env bun`. Fix: delete the broken shims (`rm "$APPDATA/npm/bun" "$APPDATA/npm/bun.cmd"`).

**`WITH expr AS alias` columns are NOT included in `SELECT *`.** ClickHouse's column-level WITH aliases (used for intermediate computations in the MV like `_timestamps`, `_prompt_periods_sec`, etc.) are not expanded by `SELECT *`. This is by design and is what allows the MV to use `SELECT *` for source columns while computing additional columns explicitly.

**`organization_id` = `user.id` in the API.** The API sets `organizationId: context.user.id` (see `apps/api/src/router.ts`). When testing the frontend locally, the user ID from the Postgres auth database must match the `organization_id` in ClickHouse data. Use `scripts/duplicate_org.sql` to copy data with a different org_id for testing.

**Stale generated types after schema changes.** After modifying `src/db/schema/*.ts`, the generated `chkit-types.ts` will be out of sync. Always run `bun run ch:codegen` (or manually copy the `.tmp` file if EPERM). The old types may have columns that no longer exist or be missing new columns — this won't cause build errors if nothing imports them yet, but will cause runtime issues when consumed.

### Backfilling session_analytics

To backfill `session_analytics` from existing `claude_sessions` data (e.g., after recreating the table), use the backfill script:

```bash
# From packages/ch-schema — runs against CI
bun run ch:query scripts/backfill.sql
```

The backfill script (`scripts/backfill.sql`) runs the same WITH/SELECT logic as the MV but as an INSERT INTO ... SELECT with explicit column lists and `SETTINGS async_insert=0`. It deduplicates via `QUALIFY ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY ingested_at DESC) = 1`.

### Codegen (TypeScript types)

After schema changes, regenerate TypeScript types:

```bash
bun run ch:codegen
```

This updates `src/generated/chkit-types.ts` (interfaces + Zod schemas) and `src/generated/chkit-ingest.ts` (typed ingest functions). If codegen fails, check for stale `.tmp` files in `src/generated/` and clean them up.

The generated `RudelSessionAnalyticsRow` type includes both source columns (from `SELECT *` on `claude_sessions`) and computed columns (from the MV). The `RudelClaudeSessionsRow` type covers only the source table columns.

### Local development shortcuts

```bash
# Run API with production databases (prd_local Doppler config)
bun run --cwd apps/api dev:env

# Run tests locally
doppler run --project rudel --config ci -- bun run verify
```
