---
date: "2026-03-03 18:32:52"
sha: "0491e1d"
category: "unclear-instruction"
status: pending
observed-workflows:
  subagents: []
  skills: ["typescript-standards"]
  commands: []
---

# TypeScript standards skill lacks function ordering guidance

## Observation

After loading the `typescript-standards` skill, the agent only fixed the inline type to an interface but left the main exported component (`CliSetupHint`) at the bottom of the file, below the helper `CommandBlock`. The user pointed out that the main function/component should be at the top, with helpers below — but the skill has no guidance on function ordering. The `code-architecture` skill mentions function ordering ("Enforces function ordering") but that context wasn't loaded either, and the `typescript-standards` skill should cover this since it's a fundamental code organization concern when writing TypeScript.

## Context

The agent created a `CommandBlock` helper component and an interface at the top of `CliSetupHint.tsx`, with the main exported `CliSetupHint` component at the bottom. After loading the `typescript-standards` skill, the agent reflected on the code but only identified the inline type issue — it missed the function ordering problem because the skill has no rules about it.

## Analysis

This is an `unclear-instruction` issue: the `typescript-standards` skill does not include any guidance on function/component ordering within a file (e.g., main exported function first, helpers below — or vice versa). The `code-architecture` skill mentions enforcing function ordering but that's a separate skill that wasn't triggered. The typescript-standards skill should include a section on function ordering conventions so the agent applies consistent ordering when writing or refactoring TypeScript files.
