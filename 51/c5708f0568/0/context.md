# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/gazed/angkor directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, etc.,...

### Prompt 2

the source for `chkit` is in `/Users/marc/Workspace/chx` how do we need to adapt those packages to make them work? so they work internally with the workspace dependency but fix it for the published packages.

### Prompt 3

can you run the cp command?

### Prompt 4

okay rebase main. and then update the chkit dependencies. I just created a new version that hopefully works.

### Prompt 5

okay so we only need to provide now the proper clickhouse credentials? to get started?

### Prompt 6

create does it make sense to have any type of test cases or integration tests for this?

### Prompt 7

Base directory for this skill: /Users/marc/.claude/plugins/cache/numiadata-ai-tools/code/1.0.8/skills/testing-vitest

# Testing Standards (Vitest)

## Framework
- Use `vitest` (not jest or bun test)
- Use `@cloudflare/vitest-pool-workers` for Cloudflare Workers
- **CRITICAL**: Always use `pnpm test`, NEVER standalone test runners

## CRITICAL Rules

### 1. Never Use Try-Catch in Positive Tests
```ts
// ❌ Bad - Hides real errors
it('should create user', async () => {
  try {
    const user = aw...

### Prompt 8

commit, push, create a PR, wait until PR passes and then merge.

