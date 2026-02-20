# Rudel

A platform for ingesting, storing, and analyzing Claude Code session transcripts. Users authenticate via the web app, use the CLI to upload `.jsonl` session transcripts, which are stored in ClickHouse for analytics.

**Stack**: Bun, Turborepo, Biome, TypeScript
**Deployment**: Cloudflare Workers + D1 (SQLite) + ClickHouse
**Domain**: `app.rudel.ai`

## Monorepo Structure

### Apps

| App | Package | Description |
|-----|---------|-------------|
| `apps/api` | `@rudel/api` | HTTP API server (Cloudflare Workers / local Bun). Auth via `better-auth`, RPC via `@orpc/server`, session ingestion into ClickHouse. |
| `apps/cli` | `rudel` (npm) | CLI tool for authenticating and uploading Claude Code session transcripts. Commands: `login`, `logout`, `whoami`, `upload`. |
| `apps/web` | `@rudel/web` | React SPA (Vite + Tailwind + shadcn). Auth UI and CLI login portal. |

### Packages

| Package | Description |
|---------|-------------|
| `packages/api-routes` (`@rudel/api-routes`) | Shared RPC contract (`@orpc/contract` + Zod schemas). Single source of truth for the API interface. |
| `packages/ch-schema` (`@rudel/ch-schema`) | ClickHouse table schema (`flick.claude_sessions`), generated TypeScript types, and ingest functions via `chkit`. |
| `packages/sql-schema` (`@rudel/sql-schema`) | Drizzle ORM schema for SQLite/D1 auth tables (`user`, `session`, `account`, `verification`). |
| `packages/typescript-config` (`@rudel/typescript-config`) | Shared `tsconfig` base files (`base.json`, `node.json`, `react-library.json`). |

### Dependency Graph

```
@rudel/typescript-config ← (devDep) all packages and apps
@rudel/api-routes        ← @rudel/api, @rudel/web, rudel CLI
@rudel/sql-schema        ← @rudel/api
@rudel/ch-schema         ← @rudel/api
```

## Secrets Management (Doppler)

This project uses Doppler for secrets. Project: `rudel`.

| Config | Database | Use for |
|--------|----------|---------|
| `prd` | Production | Running the app locally, ClickHouse queries & data exploration |
| `ci` | CI/test | Running tests locally (`bun run verify`) |

### Injecting secrets

```bash
# Production (app, queries)
doppler run --project rudel --config prd -- <command>

# CI/test (local tests)
doppler run --project rudel --config ci -- <command>
```

### ClickHouse CLI (chcli) with Doppler

chcli natively supports `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, and `CLICKHOUSE_DB` — all of which Doppler provides. No env var mapping needed.

```bash
# Query production ClickHouse
doppler run --project rudel --config prd -- bunx @obsessiondb/chcli -q "SELECT 1" -F json

# Query CI/test ClickHouse
doppler run --project rudel --config ci -- bunx @obsessiondb/chcli -q "SHOW TABLES" -F json
```

### Local development shortcuts

```bash
# Run API with CI database
bun run --cwd apps/api dev:env

# Run tests locally
doppler run --project rudel --config ci -- bun run verify

# Sync production secrets to Cloudflare Workers
bun run --cwd apps/api env:sync
```
