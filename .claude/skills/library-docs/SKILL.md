---
name: library-docs
description: CRITICAL - Fetch real-time, official library documentation instead of relying on potentially outdated training data. Use WHENEVER working with ANY external library, framework, or package (React, Vue, Express, etc.) to get the latest APIs, usage patterns, and best practices directly from authoritative sources. Essential for accurate implementation - your training data may be months or years old, but this fetches current docs.
allowed-tools: mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# Library Documentation Research

## What I Do

Fetch up-to-date, official library documentation to ensure you're using current APIs and patterns rather than potentially outdated training data. Training data can be months or years old - this skill retrieves the latest documentation directly from authoritative sources.

## Core Process

### 1. Library Resolution Pattern

Always resolve the library ID first unless explicitly provided:

```
1. Call mcp__context7__resolve-library-id with the library name
2. Evaluate matches based on:
   - Name similarity (exact matches preferred)
   - Description relevance
   - Documentation coverage (higher snippet counts = better)
   - Trust score (7-10 indicates authoritative source)
3. Select the most relevant match
```

### 2. Documentation Retrieval Pattern

Once you have the library ID:

```
1. Call mcp__context7__get-library-docs with:
   - context7CompatibleLibraryID: The resolved ID
   - topic: Specific feature/API if needed (optional)
   - tokens: 5000 default, up to 10000 for comprehensive coverage
2. Process the returned documentation
3. Extract relevant sections for the query
```

## Search Strategies

### For API Documentation

- **Libraries**: "react", "next.js", "vue", "express", "fastify"
- **Topics**: "hooks", "routing", "middleware", "components"
- **Token Strategy**: Use 7000-10000 for comprehensive API coverage

### For Implementation Patterns

- **Focus topics**: "authentication", "state-management", "error-handling"
- **Look for**: Code examples, usage patterns, best practices
- **Token Strategy**: 5000 usually sufficient for focused topics

### For Version-Specific Information

- **Format**: `/org/project/version` (e.g., `/vercel/next.js/v14.3.0`)
- **Key areas**: Breaking changes, migration guides, new features
- **Token Strategy**: Increase tokens for migration guides

## Common Library IDs

### Claude Code Documentation

- Claude Code: `/websites/claude_en_claude-code` (410+ code snippets for Claude Code features)

### Frontend Frameworks & State Management

- React: `/websites/react_dev` (1923 snippets, trust 9) or `/reactjs/react.dev` (2836 snippets, trust 10)
- TanStack Router: `/tanstack/router` (1307 snippets, trust 8)
- TanStack Query: `/tanstack/query` (749 snippets, trust 8) or `/websites/tanstack_query_v5` (4508 snippets)
- Zustand: `/pmndrs/zustand` (462 snippets, trust 9.6)

### Backend Frameworks

- Hono: `/honojs/website` (740 snippets) or `/llmstxt/hono_dev_llms_txt` (1768 snippets)
- oRPC: `/unnoq/orpc` (531 snippets, trust 9.4)
- Better Auth: `/better-auth/better-auth` (1301 snippets, trust 7.6)

### Databases & ORMs

- PostgreSQL: `/postgres/postgres` (18 snippets, trust 8.4) or `/porsager/postgres` (178 snippets, JS client)
- ClickHouse: `/clickhouse/clickhouse` (9889 snippets, trust 9.4)
- Drizzle ORM: `/drizzle-team/drizzle-orm` (436 snippets, trust 7.6)

### Build Tools & Runtimes

- Vite: `/vitejs/vite` (480 snippets, trust 8.3)
- Turborepo: `/vercel/turborepo` (822 snippets, trust 10)
- Bun: `/oven-sh/bun` (2377 snippets, trust 9.4)
- ESLint: `/eslint/eslint` (2853 snippets, trust 9.1)
- TypeScript: `/microsoft/typescript` (15930 snippets, trust 9.9)

### Testing Tools

- Vitest: `/vitest-dev/vitest` (1183 snippets, trust 8.3)

### Cloud & Infrastructure

- Supabase: `/supabase/supabase` (4552 snippets, trust 10)
- Cloudflare Workers: `/cloudflare/workers-sdk` (266 snippets, trust 9.3)
- Google Cloud Platform: `/googleapis/google-cloud-node` (1610 snippets, trust 8.5)

## Output Format Template

```markdown
## Library: [Name] ([Context7 ID])

**Version**: [If specified]
**Topic**: [If focused]

### Key APIs/Features

#### [Feature Name]

**Purpose**: [What it does]
**Usage**:
\`\`\`javascript
[Code example]
\`\`\`
**Parameters**: [If relevant]
**Returns**: [If relevant]

### Implementation Examples

[Relevant code examples from docs]

### Best Practices

- [Practice 1 from official docs]
- [Practice 2 from official docs]

### Related Documentation

- [Other relevant sections to explore]
```

## Error Handling

### Library Not Found

If resolve-library-id returns no matches:

1. Try alternative names (e.g., "nodejs" vs "node")
2. Check if it's a sub-package (e.g., "@react/router")
3. Suggest using web search for newer/niche libraries

### Insufficient Documentation

If documentation is sparse:

1. Try broader topic searches
2. Increase token limit
3. Consider multiple queries for different aspects
4. Fall back to web search for community resources

## When to Use This Skill vs Training Data or Web Search

**ALWAYS use this skill FIRST for:**

- ANY library or framework you're about to use (React, Vue, Next.js, Express, etc.)
- Getting current API signatures and methods
- Understanding the latest best practices
- Checking if APIs have changed since your training cutoff
- Verifying correct usage patterns before writing code
- Claude Code documentation (`/websites/claude_en_claude-code`)

**Why not rely on training data:**

- Your training data may be months or years old
- Libraries update frequently with breaking changes
- New features and patterns emerge constantly
- Deprecated methods may still be in your training data
- Best practices evolve - what was correct may now be anti-pattern

**Use web search only when:**

- The library isn't indexed (try this skill first)
- You need community tutorials and guides
- Looking for real-world implementation stories
- Troubleshooting specific error messages
- Comparing multiple libraries

## Integration Tips

### With Codebase Analysis

- Use to understand external dependencies
- Clarify API usage in existing code
- Verify version compatibility
- Find migration paths for updates

### With Implementation Planning

- Get official patterns before coding
- Understand API contracts
- Find recommended approaches
- Identify potential gotchas

### Performance Optimization

- Cache resolved library IDs mentally
- Use focused topics to reduce tokens
- Make multiple targeted queries vs one large query
- Start with 5000 tokens, increase only if needed

## Examples

### Example 1: React Hooks Documentation

```
1. Direct retrieve (use verified ID): mcp__context7__get-library-docs(
     context7CompatibleLibraryID="/reactjs/react.dev",
     topic="hooks",
     tokens=7000
   )
2. Extract: useState, useEffect, useContext, custom hooks patterns
```

### Example 2: TanStack Query Data Fetching

```
1. Direct retrieve (use verified ID): mcp__context7__get-library-docs(
     context7CompatibleLibraryID="/websites/tanstack_query_v5",
     topic="queries mutations",
     tokens=8000
   )
2. Extract: useQuery, useMutation, optimistic updates, caching strategies
```

### Example 3: Drizzle ORM with PostgreSQL

```
1. Direct retrieve (use verified ID): mcp__context7__get-library-docs(
     context7CompatibleLibraryID="/drizzle-team/drizzle-orm",
     topic="postgres queries",
     tokens=6000
   )
2. Extract: Query builder, joins, transactions, migrations
```

### Example 4: Hono API Development

```
1. Direct retrieve (use verified ID): mcp__context7__get-library-docs(
     context7CompatibleLibraryID="/llmstxt/hono_dev_llms_txt",
     topic="middleware routing",
     tokens=5000
   )
2. Extract: Route handling, middleware, context, error handling
```

### Example 5: Claude Code Documentation

```
1. Direct retrieve (no resolution needed): mcp__context7__get-library-docs(
     context7CompatibleLibraryID="/websites/claude_en_claude-code",
     topic="skills agents mcp",
     tokens=8000
   )
2. Extract: Skill creation, agent patterns, MCP integration
```
