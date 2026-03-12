# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/edinburgh-v1 directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting,...

### Prompt 2

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/edinburgh-v1/.context/attachments/PR instructions.md
</system_instruction>



Create a PR

### Prompt 3

<system_instruction>
The user has attached these files. Read them before proceeding.
- /Users/marc/conductor/workspaces/rudel/edinburgh-v1/.context/attachments/verify_65274681396.log
- /Users/marc/conductor/workspaces/rudel/edinburgh-v1/.context/attachments/lint-pr-title_65274681365.log
</system_instruction>



Fix the failing CI actions. I've attached the failure logs.

### Prompt 4

also update the pr-creation skill, to make sure that when we create PRs we create them with valid titles....

