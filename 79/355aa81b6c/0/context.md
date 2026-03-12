# Session Context

## User Prompts

### Prompt 1

I just tried ot delete an organization but got an internal server error, but the logs dont really indiate good logging. can you add some extra logging.

### Prompt 2

[deleteOrganization] migrating sessions from REDACTED to REDACTED
[migrateOrgSessions] migrating claude_sessions from REDACTED to REDACTED
[deleteOrganization] failed for REDACTED: 33 |     const inputIsError = input instanceof Error;
34 |     const message = inputIsError ? input.message : input;
35 |     const match = message.match(errorRe);
36 |     const ...

