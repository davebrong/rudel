# Connection Configuration Reference

chcli connects to ClickHouse over HTTP(S). Connection details can be set via environment variables or CLI flags.

## Precedence

CLI flags take precedence over environment variables. If neither is set, the default value is used.

```
CLI flag > Environment variable > Default value
```

## Configuration Options

| Flag | Env Var | Alt Env Var | Default | Description |
|------|---------|-------------|---------|-------------|
| | `CLICKHOUSE_URL` | | *(none)* | Full URL (e.g. `https://host:8443`) — parsed into host, port, secure, password |
| `--host <host>` | `CLICKHOUSE_HOST` | | `localhost` | ClickHouse server hostname or IP |
| `--port <port>` | `CLICKHOUSE_PORT` | | `8123` | HTTP interface port |
| `-u, --user <user>` | `CLICKHOUSE_USER` | `CLICKHOUSE_USERNAME` | `default` | Authentication username |
| `--password <pass>` | `CLICKHOUSE_PASSWORD` | | *(empty)* | Authentication password |
| `-d, --database <db>` | `CLICKHOUSE_DATABASE` | `CLICKHOUSE_DB` | `default` | Default database for queries |
| `-s, --secure` | `CLICKHOUSE_SECURE` | | `false` | Use HTTPS instead of HTTP |

## Resolution Order

```
CLI flag > Individual env var > CLICKHOUSE_URL (parsed) > Default value
```

When `CLICKHOUSE_URL` is set, it is parsed into host, port, secure, and password components. Individual env vars and CLI flags always take precedence over values derived from the URL.

## Examples

### Local Development (defaults)

No configuration needed — connects to `http://localhost:8123` with user `default`:

```bash
bunx @obsessiondb/chcli -q "SELECT 1"
```

### Remote Instance via CLI Flags

```bash
bunx @obsessiondb/chcli \
  --host ch.example.com \
  --port 8443 \
  --secure \
  --user admin \
  --password secret \
  -d analytics \
  -q "SELECT count() FROM events"
```

### Remote Instance via `CLICKHOUSE_URL`

The simplest way to connect to a remote instance — a single URL covers host, port, secure, and password:

```env
CLICKHOUSE_URL=https://admin:secret@ch.example.com:8443
CLICKHOUSE_DATABASE=analytics
```

### Remote Instance via Individual Environment Variables

Create a `.env` file (Bun loads it automatically):

```env
CLICKHOUSE_HOST=ch.example.com
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=admin
CLICKHOUSE_PASSWORD=secret
CLICKHOUSE_DATABASE=analytics
```

Then run queries without connection flags:

```bash
bunx @obsessiondb/chcli -q "SELECT count() FROM events"
```

### ClickHouse Cloud

ClickHouse Cloud uses HTTPS on port 8443. Either form works:

```env
# URL form
CLICKHOUSE_URL=https://default:your-password@abc123.us-east-1.aws.clickhouse.cloud:8443

# Or individual vars
CLICKHOUSE_HOST=abc123.us-east-1.aws.clickhouse.cloud
CLICKHOUSE_PORT=8443
CLICKHOUSE_SECURE=true
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
```

### Mixed (Env Vars + Flag Override)

Set base connection in `.env`, override database per-query:

```bash
bunx @obsessiondb/chcli -d other_db -q "SHOW TABLES"
```
