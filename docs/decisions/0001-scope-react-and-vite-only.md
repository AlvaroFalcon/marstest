# 0001. Scope the guidelines to React and Vite

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `CLAUDE.md`

## Context

The MarsBased React guidelines cover Next.js (their default), Vite SPAs and React Native. The user decided the project's scope up front:

> "We will focus on React and Vite, so we discard React Native and Next.js from the guidelines." (translated)

## Options considered

1. **Full handbook (Next.js default, React Native included)** — more guidance, most of it not applicable.
2. **React + Vite SPA sections only** — guidance limited to what the project uses.

## Decision

Follow only the React and Vite SPA parts of the handbook. Next.js and React Native sections are excluded from `CLAUDE.md`, agents and skills.

## Consequences

- `CLAUDE.md` uses the Vite SPA project structure (handbook §2.2) and react-router instead of the App Router.
- No server components, server actions or SSR concerns in conventions or reviews.
