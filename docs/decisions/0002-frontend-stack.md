# 0002. Front-end stack from the MarsBased React guidelines

- **Date:** 2026-10-19
- **Status:** Accepted
- **Phase:** Plan
- **Related:** `CLAUDE.md` §2, `package.json`

## Context

The project is a Vite SPA (no SSR, SEO or server code), so the Next.js and React Native parts of the handbook do not apply. The handbook lists recommended libraries for each concern.

## Options considered

1. **Install libraries only when a feature needs them** — smaller initial footprint, but each feature starts with setup work.
2. **Install the full recommended stack up front** — consistent foundation, agents can rely on it from the first feature.

## Decision

Install the recommended stack up front: Tailwind CSS v4, shadcn/ui, react-router v7, TanStack Query and Table, zustand, react-hook-form + @hookform/resolvers, zod, ky, es-toolkit, react-intl; Vitest, React Testing Library, msw and Playwright for testing.

Not installed yet: **Hey API** (needs an OpenAPI spec to generate from) and **nuqs** (only for routes with many search params).

## Consequences

- Unused libraries are tree-shaken from the bundle but still appear in `package.json`; remove any that remain unused when the project ends.
- `@hookform/resolvers` is pinned to `^5.9.2` because `6.0.0` declares conflicting optional peer dependencies (`effect@^4` vs `@typeschema/main`) that make `npm install` fail. Revisit when 6.x fixes its peer metadata.
- TanStack Table is v9, which shadcn's Data Table recipe already targets (`useTable` + `tableFeatures`).
- msw is v3: unhandled requests are configured with `onUnhandledFrame` (the v2 `onUnhandledRequest` option no longer exists).
