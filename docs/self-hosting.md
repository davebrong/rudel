# Self-Hosting Rudel

This guide covers deploying Rudel with managed services.

## Services

| Component | Provider | Purpose |
|-----------|----------|---------|
| **ClickHouse** | [ObsessionDB](https://obsessiondb.com) | Session transcript storage and analytics |
| **Postgres** | [Neon](https://neon.tech) | Authentication (users, sessions, accounts) |
| **API Server** | [Fly.io](https://fly.io) | HTTP API + static frontend serving |

## 1. Provision ClickHouse (ObsessionDB)

1. Create an account at [obsessiondb.com](https://obsessiondb.com)
2. Create a new ClickHouse instance
3. Note your connection details:
   - `CLICKHOUSE_URL` — the HTTPS endpoint (e.g. `https://your-instance.obsessiondb.com`)
   - `CLICKHOUSE_USERNAME` — your username
   - `CLICKHOUSE_PASSWORD` — your password
4. Apply the schema migration:

```bash
# Set your ClickHouse credentials
export CLICKHOUSE_URL=https://your-instance.obsessiondb.com
export CLICKHOUSE_USERNAME=your-username
export CLICKHOUSE_PASSWORD=your-password

# Run the migration (from the repo root)
# The migration uses SharedReplacingMergeTree for cloud ClickHouse
bun run --cwd packages/ch-schema ch:migrate
```

## 2. Provision Postgres (Neon)

1. Create an account at [neon.tech](https://neon.tech)
2. Create a new project and database named `rudel`
3. Note your connection string: `postgres://user:pass@host/rudel?sslmode=require`
4. Run the Drizzle migrations:

```bash
PG_CONNECTION_STRING="postgres://user:pass@host/rudel?sslmode=require" \
  bun run --cwd packages/sql-schema migrate
```

## 3. Deploy to Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create a new app:

```bash
fly launch --name rudel --no-deploy
```

3. Set environment variables:

```bash
fly secrets set \
  PG_CONNECTION_STRING="postgres://user:pass@host/rudel?sslmode=require" \
  BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  CLICKHOUSE_URL="https://your-instance.obsessiondb.com" \
  CLICKHOUSE_USERNAME="your-username" \
  CLICKHOUSE_PASSWORD="your-password" \
  APP_URL="https://rudel.fly.dev" \
  ALLOWED_ORIGIN="https://rudel.fly.dev"
```

4. Build and deploy:

```bash
# Build the frontend
bun run build

# Deploy
fly deploy
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PG_CONNECTION_STRING` | Yes | Postgres connection string |
| `BETTER_AUTH_SECRET` | Yes | Auth secret (`openssl rand -base64 32`) |
| `CLICKHOUSE_URL` | Yes | ClickHouse HTTPS endpoint |
| `CLICKHOUSE_USERNAME` | Yes | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | Yes | ClickHouse password |
| `APP_URL` | Yes | Public URL of the API server |
| `ALLOWED_ORIGIN` | Yes | CORS origin (same as `APP_URL` for single-domain) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret |
