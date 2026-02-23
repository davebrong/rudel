---
name: testing-vitest
description: CRITICAL - Invoke BEFORE writing ANY test code. Use when creating new tests, adding test cases, modifying existing tests, writing `it()` or `describe()` blocks, or touching any `*.test.ts` or `*.spec.ts` file. Enforces no try-catch in positive tests, no early returns, no test skipping.
allowed-tools: [Read, Edit, Grep, Glob, Bash]
---

# Testing Standards (Vitest)

## Framework
- Use `vitest` (not jest or bun test)
- Use `@cloudflare/vitest-pool-workers` for Cloudflare Workers
- **CRITICAL**: Always use `pnpm test`, NEVER standalone test runners

## CRITICAL Rules

### 1. Never Use Try-Catch in Positive Tests
```ts
// ❌ Bad - Hides real errors
it('should create user', async () => {
  try {
    const user = await createUser(userData)
    expect(user.id).toBeTruthy()
  } catch (error) {
    console.error('Unexpected error:', error)
  }
})

// ✅ Good - Let test framework handle errors
it('should create user', async () => {
  const user = await createUser(userData)
  expect(user.id).toBeTruthy()
})

// ✅ Good - Only for testing specific errors
it('should throw error', async () => {
  await expect(createUser(invalid)).rejects.toThrow('Invalid email')
})
```

### 2. Never Use Early Returns
```ts
// ❌ Bad - Silently skips test
it('should test API', async () => {
  if (!hasValidCredentials) return
  const result = await apiCall()
})

// ✅ Good - Fail when preconditions missing
it('should test API', async () => {
  expect(hasValidCredentials).toBe(true)
  const result = await apiCall()
})
```

### 3. Never Skip Tests for Missing Env Vars
```ts
// ❌ Bad
describe.skipIf(!process.env.CLICKHOUSE_URL)('Database Tests', () => {})

// ✅ Good - Let tests fail if env not configured
describe('Database Tests', () => {
  const env = DatabaseEnvSchema.parse(process.env)
  const client = createClientFromEnv(env)
})
```

### 4. Initialize Inline, Not in beforeEach
```ts
// ❌ Bad - Unnecessary beforeEach
describe('Tests', () => {
  let queryBuilder: QueryBuilder
  beforeEach(() => {
    queryBuilder = new QueryBuilder(schema)
  })
})

// ✅ Good - Inline initialization
describe('Tests', () => {
  const queryBuilder = new QueryBuilder(schema)
})

// ✅ Good - Use beforeEach only for async cleanup
beforeEach(async () => {
  await client.query('DELETE FROM test_table')
})
```

## Best Practices

### Use assert() for Type Narrowing
```ts
// ✅ Good - Provides type narrowing
assert(checkoutRecord)
```

### Use vi.waitFor() for Async Tests
```ts
await vi.waitFor(
  async () => {
    const result = await clickhouse.query('...')
    expect(records).toHaveLength(2)
  },
  { timeout: 5000, interval: 500 }
)
```

### Don't Assert Env Vars in Tests
Already validated in `vitest.config.ts`. Trust the config.

### Automatic State Reset (Cloudflare Workers)
Vitest automatically resets D1, KV, R2, Durable Objects between tests.

Only clean up external services (ClickHouse, external APIs).

## Test Scripts Organization
Place test scripts, utilities, one-off scripts in `repl/` folder at package root.

## Environment Variables
When adding new env vars for tests, update:
1. Package's `turbo.json` → `passThroughEnv` array
2. `.github/workflows/ci.yml` → `env` section
