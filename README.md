# Rudel

A platform for ingesting, storing, and analyzing [Claude Code](https://docs.anthropic.com/en/docs/claude-code) session transcripts. Rudel gives you a dashboard with analytics on your coding sessions — token usage, session duration, activity patterns, model usage, and more.

**How it works**: Users authenticate via the web app, install the [CLI](apps/cli/README.md), and enable automatic uploads. The CLI registers a Claude Code [hook](https://docs.anthropic.com/en/docs/claude-code/hooks) that uploads session transcripts when a session ends. Transcripts are stored in ClickHouse and processed into analytics via a materialized view.

**Stack**: Bun, TypeScript, Postgres (auth), ClickHouse (analytics)

## Local Development

Prerequisites: [Bun](https://bun.sh), [Docker](https://docker.com)

```bash
bun install
bun run dev:local
```

This starts local Postgres + ClickHouse via Docker Compose, runs migrations, and launches:

- **API** at `http://localhost:4010`
- **Web app** at `http://localhost:4011`

To manage the database containers separately:

```bash
bun run infra:up    # start Postgres + ClickHouse
bun run infra:down  # stop them
```

> **Note**: Social login (Google, GitHub OAuth) is not available in local mode — there are no OAuth client credentials configured. You can still sign up and log in with email/password.

## CLI

The [`rudel` CLI](apps/cli/README.md) is published on npm and handles authentication and session uploads:

```bash
npm install -g rudel
rudel login
rudel enable   # auto-upload sessions via Claude Code hook
```

See the [CLI README](apps/cli/README.md) for all commands.

## Project Structure

```
apps/
  api/          HTTP API server (Bun). Auth, RPC, session ingestion.
  cli/          CLI for authenticating and uploading session transcripts.
  web/          React SPA (Vite + Tailwind + shadcn). Dashboard and auth UI.

packages/
  api-routes/   Shared RPC contract (@orpc/contract + Zod schemas).
  ch-schema/    ClickHouse table schemas, migrations, and TypeScript codegen.
  sql-schema/   Drizzle ORM schema for Postgres auth tables.
  typescript-config/  Shared tsconfig base files.
```

## Self-Hosting

See [docs/self-hosting.md](docs/self-hosting.md) for deploying your own instance.
