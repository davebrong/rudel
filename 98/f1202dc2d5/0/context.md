# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/casablanca directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, e...

### Prompt 2

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/casablanca/.claude/skills/library-docs

# Library Documentation Research

## What I Do

Fetch up-to-date, official library documentation to ensure you're using current APIs and patterns rather than potentially outdated training data. Training data can be months or years old - this skill retrieves the latest documentation directly from authoritative sources.

## Core Process

### 1. Library Resolution Pattern

Always resolve th...

### Prompt 3

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/casablanca/.claude/skills/typescript-standards

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

### Prompt 4

do you know how to start the dev env?

### Prompt 5

okay i think we need to clarify (in CLAUDE.md) that there are 2 ways of running this:
1. standalone (this is with all infra locally)
2. dev (which is just api + web, but connecting to neon + obsessiondb, the prod datbases with the prd_local doppler config)
figure out how both work and add how to run them to CLAUDE.md

### Prompt 6

okay now run the local dev (not standalone) the web and api in the background so i can test the feature we build

### Prompt 7

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/casablanca/.context/attachments/PR instructions.md
</system_instruction>



Create a PR

