# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/lisbon directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, etc.,...

### Prompt 2

1. i think this is fine, because its a manual thing the user does, and its expected to fail "actively"

2. add a default concurrency of 5 to all batch uploads. potentially configurable

### Prompt 3

insteaed of implementing this yourself, import `p-map` it can do this, also helps with exponential backoff and retries (I think its built into p-map

