# rudel

CLI for uploading [Claude Code](https://docs.anthropic.com/en/docs/claude-code) session transcripts to [Rudel](https://app.rudel.ai) for analytics.

## Installation

```bash
npm install -g rudel
```

## Quick Start

```bash
# 1. Log in via your browser
rudel login

# 2. Enable automatic session uploads
rudel enable

# That's it! Your Claude Code sessions will now be uploaded automatically.
```

## Commands

### `rudel login`

Authenticate with Rudel. Opens your browser to [app.rudel.ai](https://app.rudel.ai) where you sign in, then the CLI receives a token automatically.

### `rudel enable`

Registers a [Claude Code hook](https://docs.anthropic.com/en/docs/claude-code/hooks) that automatically uploads your session transcript when a Claude Code session ends. This is the recommended way to use Rudel -- set it and forget it.

### `rudel disable`

Removes the auto-upload hook.

### `rudel upload <session>`

Manually upload a session transcript. Accepts a session ID or path to a `.jsonl` file.

```bash
# Upload by session ID
rudel upload abc123

# Upload a specific file
rudel upload ./path/to/session.jsonl

# Preview without uploading
rudel upload abc123 --dry-run

# Auto-classify the session
rudel upload abc123 --classify
```

### `rudel whoami`

Show the currently authenticated user.

### `rudel logout`

Clear stored credentials.

## Links

- **Web App**: [app.rudel.ai](https://app.rudel.ai)
- **Issues**: [GitHub Issues](https://github.com/obsessiondb/rudel/issues)
