# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/zurich directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, et...

### Prompt 2

okay we also need a env variable for the active or, that the user can set.
set it into the .env file
```
REDACTED
```
and then test the api-testing skill

### Prompt 3

okay also document where to find all the contracts / payloads etc... in which folder so you know which endpoints can be fetched with which parameters.
also did you test the requests

### Prompt 4

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/zurich/.context/attachments/PR instructions.md
</system_instruction>



Create a PR

### Prompt 5

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/zurich/.claude/skills/pr-creation

# PR Creation Checklist

Follow these steps in order when creating a pull request. Do not skip any step.

## 1. Run Verification

```bash
bun run verify
```

This runs type checking, linting, and tests across the monorepo.

**Do NOT proceed if verification fails.** Fix issues first, then re-run.

## 2. Review the Workspace Diff

Use `mcp__conductor__GetWorkspaceDiff` with `stat: true` to s...

