---
name: code-architecture
description: Code architecture patterns. Use when organizing code, refactoring classes, designing service structure, or extracting/moving code to new files. Enforces function ordering, service functions over classes, dependency injection.
allowed-tools: [Read, Edit, Grep, Glob]
---

# Code Architecture Standards

**CRITICAL**: Always apply these patterns when:
- Creating a new file that will contain multiple functions
- Extracting code from one file to another
- Refactoring or reorganizing existing code structure

## Function Order (Clean Code)
Organize from high-level to detail:

```ts
// 1. Constants, types, schemas at top
const CONFIG = { ... } as const
type Options = { ... }

// 2. Main/entry point functions
async function main() {
  await initialize()
  await processData()
}

// 3. Supporting functions
async function initialize() { ... }
async function processData() { ... }

// 4. Utilities at bottom
function formatDate(date: Date) { ... }
```

## Avoid Bloat Proxy Functions
```ts
// ❌ Bad - Pure bloat
class MyWorkflow {
  async getCursorStats() {
    return await cursorService.getCursorStats({ DB: this.env.DB })
  }
}

// ✅ Good - Import and use directly
import { getCursorStats } from './cursor-service'
const stats = await getCursorStats(env)
```

## Prefer Service Functions Over Classes
```ts
// ❌ Bad - Unnecessary class wrapper
export class CursorService {
  constructor(private db: D1Database) {}
  async getCursor(shopDomain: string) { ... }
}

// ✅ Good - Individual functions with DI
export async function getCursor(
  shopDomain: string,
  env: { DB: D1Database }
) {
  return await env.DB.prepare('...').bind(shopDomain).first()
}
```

### Benefits
- Tree-shakable: Only import what you need
- Testable: Easy to mock dependencies
- Explicit dependencies
- No instantiation overhead
- Functional style

## When to Use Classes vs Functions
- **Classes**: Complex stateful objects, entities with behavior, inheritance
- **Functions**: Simple services, utilities, data transformation, API calls

## When to Extract Shared Services

When a new endpoint needs the same orchestration as existing code (queue handlers, cron jobs, other endpoints):

**Extract a shared function when:**
- The code is **exactly the same** (not just similar)
- Changes should **always propagate** to both call sites
- It represents the **same semantic operation** (e.g., "run an uptime check", "process a payment")

**Don't force abstractions when:**
- Code paths are similar but could legitimately diverge
- The operations might need independent evolution
- Forcing alignment would create awkward conditional logic

```ts
// ❌ Bad - Duplicated orchestration
// In queue handler
const result = await executeCheck(monitor);
await writeResult(result);
await processAlert(result);

// In new endpoint (duplicated!)
const result = await executeCheck(monitor);
await writeResult(result);
await processAlert(result);

// ✅ Good - Shared service function
export async function runUptimeCheck(
  monitor: Monitor,
  env: { DB: D1Database }
): Promise<CheckResult> {
  const result = await executeCheck(monitor);
  await writeResult(result, env);
  await processAlert(result, env);
  return result;
}

// Both queue handler and endpoint call the service
await runUptimeCheck(monitor, env);
```

## Dependency Injection Pattern
Always use last parameter as `env` object:
```ts
export async function myFunction(
  param1: string,
  param2: number,
  env: { DB: D1Database; KV: KVNamespace }
) {
  // Function implementation
}
```
