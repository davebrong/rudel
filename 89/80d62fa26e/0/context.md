# Session Context

## User Prompts

### Prompt 1

how do i upload historical sessions?

### Prompt 2

please upload historical sessions and let me know when done

### Prompt 3

Analyze the current conversation and create a feedback entry capturing the issue.

## Step 1: Gather Context

Get datetime and git SHA:

```bash
date '+%Y-%m-%d %H:%M:%S'
git rev-parse --short HEAD 2>/dev/null || echo "no-git"
```

From the conversation, extract:

- What task was being worked on
- What the agent did (the problematic behavior)
- The user's observation (from the argument)

## Step 2: Extract Observed Workflows

Carefully review the conversation and extract ALL workflows that were ...

### Prompt 4

[Request interrupted by user]

### Prompt 5

Analyze the current conversation and create a feedback entry capturing the issue.

## Step 1: Gather Context

Get datetime and git SHA:

```bash
date '+%Y-%m-%d %H:%M:%S'
git rev-parse --short HEAD 2>/dev/null || echo "no-git"
```

From the conversation, extract:

- What task was being worked on
- What the agent did (the problematic behavior)
- The user's observation (from the argument)

## Step 2: Extract Observed Workflows

Carefully review the conversation and extract ALL workflows that were ...

