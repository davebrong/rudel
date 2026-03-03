---
date: "2026-03-03 18:30:28"
sha: "0491e1d"
category: "missing-check"
status: pending
observed-workflows:
  subagents: []
  skills: ["typescript-standards"]
  commands: []
---

# TypeScript standards skill not loaded before writing TypeScript code

## Observation

The agent wrote a new inline React component (`CommandBlock`) with an inline object type for props instead of a named interface. The user had to explicitly ask "did you load the typescript-standards skill for this?" — the agent should have proactively loaded the skill before writing TypeScript code, as the skill description says: "Use when writing TypeScript, reviewing code, or refactoring."

## Context

The user asked the agent to extract a reusable `CommandBlock` component from repeated markup in `CliSetupHint.tsx`. The agent created the component with an inline object type `{ label: string; command: string; hint?: string }` for props. After the user prompted, the agent loaded the `typescript-standards` skill which specifies "Prefer Interfaces for Extending" — the props should have been a named interface from the start.

## Analysis

The `typescript-standards` skill is marked as "CRITICAL - Use when writing TypeScript, reviewing code, or refactoring" but the agent did not proactively invoke it before writing the new component. This is a missing-check: the agent should always load the typescript-standards skill before writing or modifying TypeScript code, not wait for the user to remind it. The skill's trigger conditions clearly matched (writing new TypeScript code), but the agent skipped the step.
