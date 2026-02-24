# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plan: Add Release Please for Automated CLI Releases

## Context

The `rudel` CLI (published to npm as `rudel`, currently v0.1.4) is released manually via `scripts/release-cli.ts`, which requires interactive npm OTP and running the script locally. The goal is to automate changelog generation from conventional commits and automate npm publishing when a Release PR is merged.

## Changes

### 1. Create `release-please-config.json` (new file, root)

Release Please man...

### Prompt 2

ah we cant do the release automatically, since I have an OTP enabled for my NPM account. so remove the auomatic release part.... I need to run it manually locally. Update everythign accordingly

