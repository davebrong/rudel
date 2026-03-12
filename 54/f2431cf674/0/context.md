# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/abuja directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, etc., ...

### Prompt 2

yes we need to address all of them

### Prompt 3

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/abuja/.claude/skills/typescript-standards

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
  fetchCompou...

### Prompt 4

api/auth-info should not be needed, there are only 2 hardcoded providers: github + google

### Prompt 5

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/abuja/.context/attachments/PR instructions.md
</system_instruction>



Create a PR

