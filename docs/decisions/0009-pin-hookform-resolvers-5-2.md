# 0009. Pin @hookform/resolvers to 5.2.x

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** Claude
- **Phase:** Implement
- **Related:** ADR 0002, ADR 0008, `package.json`, PR #1

## Context

The first run of the pull request checks failed in every job at `npm ci`: the lockfile was not in sync with `package.json`. From 5.4.3 onwards `@hookform/resolvers` declares more than twenty optional peer dependencies (`ajv`, `ajv-formats`, `valibot`, `effect`...). npm resolves them against unrelated packages already in the tree (ESLint's `ajv@6`, the shadcn CLI's `ajv-formats@3`) and writes a lockfile that `npm ci` then rejects. This happens with npm 10 and npm 11, even when the lockfile is regenerated from scratch.

## Options considered

1. **`legacy-peer-deps=true` in `.npmrc`** — hides the problem, but disables peer dependency checks for the whole project.
2. **`overrides`** — tried; npm still produced an invalid lockfile.
3. **Pin `@hookform/resolvers` to `~5.2.2`** — the latest version whose only peer dependency is `react-hook-form`.

## Decision

Pin `@hookform/resolvers` to `~5.2.2`. It was checked to validate zod v4 schemas through `zodResolver`.

## Consequences

- `npm ci` passes with npm 10 and npm 11, locally and in CI.
- Before upgrading, run `npm ci` on a clean checkout and upgrade only if the lockfile stays valid.
