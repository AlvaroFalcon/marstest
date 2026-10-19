# 0005. Meaningful JSDoc on exported code

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `CLAUDE.md` §8, `.claude/agents/react-vite-expert.md`

## Context

The user asked the React/Vite expert agent to follow the project guidelines to the letter and to:

> "comment the code with meaningful JSDoc comments." (translated)

The handbook's coding guidelines say to comment only the *why*. Claude flagged the tension, and the user reviewed an example of how both fit together.

## Options considered

1. **Handbook only: comment only the why** — very few comments, no JSDoc.
2. **JSDoc on every exported symbol, limited to what the signature does not say** — purpose, reasons, non-obvious semantics.

## Decision

Every exported component, hook, function and type gets a JSDoc block with its purpose, the *why* and non-obvious semantics; inline comments explain only the *why*.

## Consequences

- Reviews flag both missing JSDoc and JSDoc that merely restates the code.
