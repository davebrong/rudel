# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/chennai directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, etc....

### Prompt 2

can we also write some test cases for this? and do some research in a subagent where claude code sessions are stored on windows

### Prompt 3

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/chennai/.claude/skills/testing-vitest

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
    const user = await creat...

### Prompt 4

okay the most critical part is mapping the pwd to the folder in `~/.claude/projects` e.g. inspect how its structured on this machine, and sanitized based on the folder

