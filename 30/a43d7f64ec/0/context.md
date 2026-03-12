# Session Context

## User Prompts

### Prompt 1

i want to show the `rudel upload` the same way as the other commands.

### Prompt 2

make a new inline component for the command

### Prompt 3

also allow an optional hint for every command. And then check the hint at the bottom, and put them to the according command where it makes sense

### Prompt 4

did you load the typescript-standards skill for this? if not do it and reflect on the code

### Prompt 5

Base directory for this skill: /Users/marc/Workspace/rudel/.claude/skills/typescript-standards

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
  fetchCompoundDigest,
  build...

### Prompt 6

Analyze the current conversation and create a feedback entry capturing the issue.

## Step 1: Gather Context

Get datetime and git SHA:

```bash
date '+%Y-%m-%d %H:%M:%S'
git rev-parse --short HEAD 2>/dev/null || echo "no-git"
```

From the conversation, extract:

- What task was being worked on
- What the agent did (the problematic behavior)
- The user's observation (from the argument)

## Step 2: Extract Observed Workflows

Carefully review the conversation and extract ALL workflows that were ...

### Prompt 7

Analyze the current conversation and create a feedback entry capturing the issue.

## Step 1: Gather Context

Get datetime and git SHA:

```bash
date '+%Y-%m-%d %H:%M:%S'
git rev-parse --short HEAD 2>/dev/null || echo "no-git"
```

From the conversation, extract:

- What task was being worked on
- What the agent did (the problematic behavior)
- The user's observation (from the argument)

## Step 2: Extract Observed Workflows

Carefully review the conversation and extract ALL workflows that were ...

