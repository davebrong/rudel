# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/curitiba directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, ...

### Prompt 2

okay i just tried to delete one of my orgs, but could not.

### Prompt 3

can you not retrieve the output from this task `bcqxyic2y`

### Prompt 4

okay just did, try again

### Prompt 5

done

### Prompt 6

yeah the mutation of sessions can be async, its more important that the org afterwards in D1 is deleeted, so the user is not "seeing" it anymore.

### Prompt 7

make sure after the delete operation we are refreshing the organization list query

### Prompt 8

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/curitiba/.context/attachments/PR instructions.md
</system_instruction>



Create a PR

### Prompt 9

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/curitiba/.claude/skills/pr-creation

# PR Creation Checklist

Follow these steps in order when creating a pull request. Do not skip any step.

## 1. Run Verification

```bash
bun run verify
```

This runs type checking, linting, and tests across the monorepo.

**Do NOT proceed if verification fails.** Fix issues first, then re-run.

## 2. Review the Workspace Diff

Use `mcp__conductor__GetWorkspaceDiff` with `stat: true` to...

