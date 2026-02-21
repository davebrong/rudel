# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/lagos directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, etc., ...

### Prompt 2

i saw that we are mapping this in ci.yml
```
 DATABASE_URL: ${{ secrets.PG_CONNECTION_STRING }}
```

i dont like this patter. I want to always map environment variables to their same name, otherwise its a possible issue. please align all the env variables for the postgres to `PG_CONNECTION_STRING`

### Prompt 3

Commit and push all changes

