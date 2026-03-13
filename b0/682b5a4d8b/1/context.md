# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: Add Export/Share Buttons with Watermark to Rudel Charts

## Context

Rudel's dashboard charts have no export or sharing functionality. We want to add "Share to X" (Twitter) buttons similar to datalenses, plus a branded watermark so shared screenshots are identifiable as coming from Rudel. The watermark should show "rudel.ai" prominently and "powered by ObsessionDB" in small text.

## Approach

### 1. Install dependencies

- `html-to-image` — DOM screensho...

### Prompt 2

Base directory for this skill: /Users/alvaro/Workspace/obsessiondb/rudel/.claude/skills/library-docs

# Library Documentation Research

## What I Do

Fetch up-to-date, official library documentation to ensure you're using current APIs and patterns rather than potentially outdated training data. Training data can be months or years old - this skill retrieves the latest documentation directly from authoritative sources.

## Core Process

### 1. Library Resolution Pattern

Always resolve the librar...

### Prompt 3

Base directory for this skill: /Users/alvaro/Workspace/obsessiondb/rudel/.claude/skills/typescript-standards

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
  fetchCompoundD...

### Prompt 4

Create a PR

