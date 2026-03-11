# Session Context

## User Prompts

### Prompt 1

I see 500 errors when loading the Project details specifically this endpoint https://app.rudel.ai/rpc/analytics/projects/details

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

ok commit and open pr

