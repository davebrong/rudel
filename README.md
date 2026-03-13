# Rudel (Private Fork)

Analytics for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions — token usage, session duration, activity patterns, model usage, and more.

This is a private fork of [obsessiondb/rudel](https://github.com/obsessiondb/rudel) for self-hosted deployment.

## Server Deployment

### 1. Clone and configure

```bash
git clone https://github.com/davebrong/rudel.git
cd rudel
cp .env.example .env
```

Edit `.env`:

```env
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
APP_URL=https://your-domain.com
```

### 2. Start everything

```bash
docker compose up -d
```

This starts Postgres, ClickHouse, runs migrations automatically, then starts the app on port 3150. Put a reverse proxy (nginx, Caddy, etc.) in front to handle HTTPS on port 443 → localhost:3150.

### 3. Verify

```bash
curl http://localhost:3150/health
```

### Google OAuth (optional)

To let users sign in with Google:

1. Create an OAuth 2.0 Client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Set the redirect URI to `https://your-domain.com/api/auth/callback/google`
3. Add to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Then restart: `docker compose up -d`

### Rebuild after code changes

```bash
docker compose up -d --build
```

### Reset (wipe all data)

```bash
docker compose down -v
docker compose up -d
```

## Developer Setup

Each developer runs these commands once on their machine.

### 1. Install the CLI

```bash
npm install -g github:davebrong/rudel-cli
```

### 2. Log in

```bash
rudel login --api-base https://your-domain.com --web-url https://your-domain.com
```

This opens your browser to sign in. The CLI receives a token automatically.

### 3. Enable auto-upload

```bash
rudel enable
```

This registers a Claude Code hook that uploads session transcripts automatically when a session ends. Nothing else runs on the developer's machine.

### 4. Verify

```bash
rudel whoami
```

### Upload past sessions (optional)

```bash
rudel upload --endpoint https://your-domain.com/rpc
```

**Important:** `rudel upload` without `--endpoint` sends data to the official `app.rudel.ai`, not your private instance. Always pass `--endpoint`. The auto-upload hook from `rudel enable` uses the correct URL automatically.

## Architecture

```
docker compose up -d
  ├── postgres        — Auth database (users, sessions, API keys)
  ├── clickhouse      — Analytics database (session transcripts)
  ├── migrate-pg      — Runs Postgres migrations, then exits
  ├── migrate-ch      — Runs ClickHouse migrations, then exits
  └── app             — API + Web UI on port 3150
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | Yes | Auth secret (`openssl rand -base64 32`) |
| `APP_URL` | Yes | Public URL of the deployed app |
| `TRUSTED_ORIGINS` | No | Comma-separated extra trusted origins |
| `RATE_LIMIT_INGEST_MAX` | No | Max uploads per user per hour (default: 120) |
| `RATE_LIMIT_INGEST_WINDOW` | No | Rate limit window in seconds (default: 3600) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

## License

[MIT](LICENSE)
