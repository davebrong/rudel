# Session Context

## User Prompts

### Prompt 1

The projet details endpoint still returns {
    "json": {
        "defined": false,
        "code": "INTERNAL_SERVER_ERROR",
        "status": 500,
        "message": "Internal server error"
    }
} - her eis the payload {json: {projectPath: "/Users/marc/Workspace/rudel", days: 7}}
json
: 
{projectPath: "/Users/marc/Workspace/rudel", days: 7}
days
: 
7
projectPath
: 
"/Users/marc/Workspace/rudel and the headers : Request URL
https://app.rudel.ai/rpc/analytics/projects/details
Request Method
POST...

### Prompt 2

Base directory for this skill: /Users/rafa/Obsession/rudel/.claude/skills/api-testing

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

The user must already exist in the database (created via the web UI o...

### Prompt 3

Base directory for this skill: /Users/rafa/Obsession/rudel/.claude/skills/pr-creation

# PR Creation Checklist

Follow these steps in order when creating a pull request. Do not skip any step.

## 1. Run Verification

```bash
bun run verify
```

This runs type checking, linting, and tests across the monorepo.

**Do NOT proceed if verification fails.** Fix issues first, then re-run.

## 2. Review the Workspace Diff

Use `mcp__conductor__GetWorkspaceDiff` with `stat: true` to see all changed files,...

