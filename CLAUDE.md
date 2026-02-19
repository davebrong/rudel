# Rudel

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
