# Session Context

## User Prompts

### Prompt 1

running the release script leads to error, why?\
bun run release:cli
$ bun run ./scripts/release-cli.ts
Checking prerequisites...
$ bun --version
1.3.9
$ git --version
git version 2.50.1 (Apple Git-155)
$ npm --version
10.9.4
$ git rev-parse --abbrev-ref HEAD
main
$ git status --porcelain
$ npm whoami
m0c
Version: 0.1.8 (not yet published, skipping bump)
Running quality gates (lint, typecheck, test, build)...
$ bun run verify
• Packages in scope: //, @rudel/agent-adapters, @rudel/api, @rudel/...

