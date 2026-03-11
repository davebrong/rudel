# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/bogota-v1 directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting,...

### Prompt 2

what about validating the schema of the file? to check if it structurallly follows the session format? and then it would be muhc harder to prompt inject or wouldnt it?

### Prompt 3

okay lets just drop the `--dangerously-skip-permissions` or maybe can we just give the read permissions of a specific folder? what other ways to not break the UX is possible?

