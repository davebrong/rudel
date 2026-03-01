# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/geneva-v1 directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, et...

### Prompt 2

okay can you give me a detailed prompt, that I should run on CHkit to fix the issue in the source repo. we dont want to work around it, but rather fix.

### Prompt 3

rebase main

### Prompt 4

did we link the chkit to the local version? I want to rerun the backfill, with the latest chkit. ( i think there is a command for linking in package.json),

### Prompt 5

Continue from where you left off.

### Prompt 6

commit current chnages. and then merge main into this branch

### Prompt 7

if we are fully rebased and merged with main, why dont I see those 2 lines (on main) in root package.json
```
		"chkit:link": "bun scripts/chkit-link.ts link",
		"chkit:unlink": "bun scripts/chkit-link.ts unlink"
```

