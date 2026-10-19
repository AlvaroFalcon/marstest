# 0009. Adopt the full recommended stack from the handbook

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `CLAUDE.md` §2, `package.json`

## Context

After the first setup, Claude listed the handbook items the project was missing. The user decided to adopt all of them: "we add everything you told me" (translated), including installing the stack.

## Options considered

1. **Install libraries only when a feature needs them** — smaller footprint, setup work in every feature.
2. **Install the recommended stack up front** (proposed by Claude) — consistent foundation from the first feature.

## Decision

Install the handbook stack up front: Tailwind CSS v4, shadcn/ui, react-router v7, TanStack Query and Table, zustand, react-hook-form, zod, ky, es-toolkit, react-intl, the React Compiler, Vitest, React Testing Library, msw and Playwright.

## Consequences

- Hey API and nuqs wait until an OpenAPI spec or a route with many search params needs them.
- Library versions and their caveats are documented in `CLAUDE.md` §2.
