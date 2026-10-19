# 0016. Separate TypeScript project for tests

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** PR #1

## Context

The code reviewer noted that `vitest/globals` was part of the application's TypeScript types. As a consequence, `describe`, `it` and `expect` type-checked inside application code, so a test helper used by mistake in production code would only fail at runtime. Claude first proposed postponing the change; the user asked for it to be done.

## Options considered

1. **Keep one TypeScript project for app and tests** — simpler config, test globals leak into app code.
2. **Separate `tsconfig.test.json`** (proposed by the reviewer) — app code is checked without test globals.

## Decision

Add `tsconfig.test.json` for test files and helpers with Vitest globals; `tsconfig.app.json` excludes them and no longer includes test types.

## Consequences

- Using `expect` or other test globals in application code now fails `npm run build`.
- `tsc -b` checks three projects: app, node (configs and E2E) and tests.
