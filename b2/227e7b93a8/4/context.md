# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/chiang-mai directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, e...

### Prompt 2

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/chiang-mai/.claude/skills/clickhouse-query

# chcli — ClickHouse CLI

chcli is a lightweight ClickHouse command-line client. Use it to run SQL queries, explore schemas, and extract data from ClickHouse databases.

## Running chcli

Prefer `bunx` if Bun is available, otherwise use `npx`:

```bash
bunx @obsessiondb/chcli -q "SELECT 1"
npx @obsessiondb/chcli -q "SELECT 1"
```

Or install globally:

```bash
bun install -g chcli
...

### Prompt 3

1. good
2. good
3. why the fuck do we have the test pollution in the PROD database? those should be different clickhouse instances
4. i am aware of this. We may need a "org" migration,

