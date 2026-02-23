# Rudel

A platform for ingesting, storing, and analyzing Claude Code session transcripts.

Users authenticate via the web app, use the [CLI](apps/cli/README.md) to upload `.jsonl` session transcripts, which are stored in ClickHouse for analytics.

**Stack**: Bun, TypeScript, Postgres, ClickHouse

## Local Development

Prerequisites: [Bun](https://bun.sh), [Docker](https://docker.com)

```bash
bun install
bun run dev:local
```

This starts local Postgres + ClickHouse via Docker, runs migrations, and launches the API (`:4010`) and web app (`:4011`).

To manage the database containers separately:

```bash
bun run infra:up    # start Postgres + ClickHouse
bun run infra:down  # stop them
```

## Self-Hosting

See [docs/self-hosting.md](docs/self-hosting.md) for deploying with ObsessionDB + Neon + Fly.io.
