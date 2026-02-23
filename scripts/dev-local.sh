#!/usr/bin/env bash
set -e

# 1. Start Postgres + ClickHouse (idempotent)
docker compose up -d --wait

# 2. Run Postgres migrations (idempotent — skips already-applied)
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/rudel \
  bun run --cwd packages/sql-schema migrate

# 3. Start API + Web in parallel with local env vars
export PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/rudel
export BETTER_AUTH_SECRET=local-dev-secret-that-is-at-least-32-chars-long
export CLICKHOUSE_URL=http://localhost:8123
export CLICKHOUSE_PASSWORD=clickhouse
export APP_URL=http://localhost:4011

# Run API and Web in parallel, kill both on Ctrl+C
bun --watch apps/api/src/index.ts &
API_PID=$!
bun run --cwd apps/web dev &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null" EXIT
wait
