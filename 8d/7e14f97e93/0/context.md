# Session Context

## User Prompts

### Prompt 1

<system_instruction>
You are working inside Conductor, a Mac app that lets the user run many coding agents in parallel.
Your work should take place in the /Users/marc/conductor/workspaces/rudel/tunis-v1 directory (unless otherwise directed), which has been set up for you to work in.
Each workspace has a .context directory (gitignored) where you can save files to collaborate with other agents.
The target branch for this workspace is main. Use this for actions like creating new PRs, bisecting, ...

### Prompt 2

Base directory for this skill: /Users/marc/conductor/workspaces/rudel/tunis-v1/.claude/skills/api-testing

# API Testing

Test authenticated requests against the local Rudel API (`http://localhost:4010`).

## Prerequisites

1. The API server must be running locally on port 4010
2. A `.env` file at the project root with test credentials:

```
API_TESTING_USER=user@example.com
API_TESTING_PASSWORD=yourpassword
API_TESTING_ORG=<organization-id>
```

The user must already exist in the database (c...

