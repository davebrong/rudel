---
name: typescript-standards
description: TypeScript coding standards. Use when writing TypeScript, reviewing code, or refactoring. Enforces named exports, no dynamic imports, discriminated unions, proper type safety.
allowed-tools: [Read, Edit, Grep, Glob]
---

# TypeScript Standards

## Named Exports Only
```ts
// ❌ Bad
export default function myFunction() {}

// ✅ Good
export function myFunction() {}
```

## Package Exports (Monorepo)

Only export what other packages actually consume:

```ts
// ❌ Bad - Exports everything including internal types
export * from "./digest";

// ✅ Good - Explicit public interface
export {
  fetchCompoundDigest,
  buildCompoundDigestBlocks,
  type CompoundDigestEnv,
} from "./digest";
```

Before adding exports, check what's actually imported by consumer packages.

## Import Patterns

### Prefer Static Imports
Always use static imports at the top of the file. Only use dynamic imports (`await import()`) when:
- Conditional loading is required (feature flags, environment checks)
- Code splitting is intentional for performance
- Circular dependency breaking is necessary

Never use dynamic imports just to import something mid-function when a static import would work.

### Type-Only Imports
For values used only as types, use explicit type-only imports:
```ts
// ❌ Bad - Imports value but only uses type
import { MyClass } from './my-class'
type Instance = MyClass

// ✅ Good - Clear intent, no runtime import
import { type MyClass } from './my-class'
type Instance = MyClass
```

## Naming Conventions
- **Files**: kebab-case (`my-component.ts`)
- **Variables/functions**: camelCase (`myVariable`, `myFunction()`)
- **Classes/types/interfaces**: PascalCase (`MyClass`, `MyInterface`)
- **Constants/enum values**: ALL_CAPS (`MAX_COUNT`)
- **Generic type parameters**: Prefix with `T` (`TKey`, `TValue`)

## Type Safety Rules

### No Type Casts
Never use `as` or `as unknown as` type assertions. They hide type incompatibilities:
```ts
// ❌ Bad - Hides the real problem
const env = context.env as unknown as ExecutorEnv

// ✅ Good - Fix the underlying type mismatch
// Option 1: Properly type the source
const env: ExecutorEnv = context.env

// Option 2: Use type guards for runtime checking
function isExecutorEnv(env: unknown): env is ExecutorEnv {
  return typeof env === 'object' && env !== null && 'DB' in env
}
```

If you encounter code that seems to require a cast:
1. Investigate why the types don't match
2. Fix the source type definitions
3. If copying from existing code with casts, note it needs cleanup

### Prefer Discriminated Unions
```ts
// ✅ Good - Prevents impossible states
type FetchingState<TData> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TData }
  | { status: 'error'; error: Error }

// Handle with switch
switch (state.status) {
  case 'success':
    console.log(state.data)
    break
}
```

### Optional Properties
Use sparingly. Prefer `T | undefined` over `T?` to force explicit passing:
```ts
// ✅ Good
type AuthOptions = {
  userId: string | undefined
}
```

### Prefer Interfaces for Extending
```ts
// ❌ Bad - & operator has terrible performance
type C = A & B

// ✅ Good
interface C extends A, B {}
```

### Don't Use Enums
Use `as const` objects instead:
```ts
const sizes = {
  xs: 'EXTRA_SMALL',
  sm: 'SMALL',
} as const

type Size = keyof typeof sizes
```

## Installing Libraries
Never rely on training data for versions. Always install latest:
```bash
pnpm add -D @typescript-eslint/eslint-plugin
```

## Async Operations
Use `Promise.all` for parallel operations:
```ts
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()])
```

## Immutability
- Use readonly arrays
- Use const assertions
- Create new objects instead of mutating
