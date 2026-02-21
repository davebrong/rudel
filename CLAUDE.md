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
| `packages/ch-schema` (`@rudel/ch-schema`) | ClickHouse table schema (`flick.claude_sessions`), generated TypeScript types, and ingest functions via `chkit`. |
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
| `DATABASE_URL` | Yes | Postgres connection string (e.g. `postgres://postgres:postgres@localhost:5432/rudel`) |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (generate with `openssl rand -base64 32`) |
| `CLICKHOUSE_URL` | Yes | ClickHouse HTTP endpoint |
| `CLICKHOUSE_USERNAME` | No | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | No | ClickHouse password |
| `CLICKHOUSE_DB` | No | ClickHouse database name |
| `APP_URL` | No | API base URL (default: `http://localhost:4010`) |
| `ALLOWED_ORIGIN` | No | CORS origin (default: `http://localhost:4011`) |

## Self-Hosting

```bash
docker compose up
```

This starts Postgres, ClickHouse, and the Rudel server. Everything works with zero external accounts.

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
```
