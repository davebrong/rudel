# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/el-paso directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, etc....

### Prompt 2

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/el-paso/.context/attachments/PR instructions.md
</system_instruction>



Create a PR

### Prompt 3

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/el-paso/.claude/skills/pr-creation

# PR Creation Checklist

Follow these steps in order when creating a pull request. Do not skip any step.

## 1. Run Verification

```bash
bun run verify
```

This runs type checking, linting, and tests across the monorepo.

**Do NOT proceed if verification fails.** Fix issues first, then re-run.

## 2. Review the Workspace Diff

Use `mcp__conductor__GetWorkspaceDiff` with `stat: true` to see...

