# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/wellington directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, e...

### Prompt 2

[Request interrupted by user for tool use]

### Prompt 3

the migrate users to orgs, would it be possible to implement in a migration? so it automatically runs when we migrate the schema? (or in an extra step. -> dedicated migration)

### Prompt 4

yes, rather make it a migration then. but generate the migraiton with the drizzle cli instead of manually

### Prompt 5

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/wellington/.claude/skills/typescript-standards

# TypeScript Standards

## Named Exports Only
```ts
// ❌ Bad
export default function myFunction() {}

// ✅ Good
export function myFunction() {}
```

## Package Exports (Monorepo)

Only export what other packages actually consume:

```ts
// ❌ Bad - Exports everything including internal types
export * from "./digest";

// ✅ Good - Explicit public interface
export {
  fetchC...

### Prompt 6

Continue from where you left off.

### Prompt 7

continue

