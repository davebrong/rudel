# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: Context-aware empty state on Dashboard

## Context

When the Dashboard shows zero sessions for the selected time range, it always displays `CliSetupHint` (install CLI instructions). This is wrong when the user has sessions — just not in the selected range. We need to distinguish between "no sessions ever" (show CLI setup) and "no sessions in this range" (show a hint to change the time filter).

## Approach

Add a `total_sessions` field to the existing KP...

