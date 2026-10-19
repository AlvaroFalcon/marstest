# 0017. CLAUDE.md is the only source of conventions

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `CLAUDE.md` §14, `.claude/agents/code-reviewer.md`, PR #1

## Context

The code reviewer suggested a global `prefers-reduced-motion` rule that the MarsBased CSS guidelines forbid, because `CLAUDE.md` only said "respect `prefers-reduced-motion`". Claude proposed letting agents fetch the online handbook as the source of truth. The user rejected external sources:

> "I don't want external things; I understand that CLAUDE.md, or other local documentation we have, should be enough." (translated)

## Options considered

1. **Online handbook as source of truth, fetched by agents** (proposed by Claude) — complete, but depends on an external site that can change.
2. **Local documentation only** — `CLAUDE.md` and `.claude/rules/` must be precise and complete enough.

## Decision

`CLAUDE.md` and `.claude/rules/` are the only source of conventions. Agents do not consult external guides; uncovered cases are raised to the user and, if agreed, added to `CLAUDE.md`.

## Consequences

- `CLAUDE.md` §7 was completed with the CSS rules that were missing from the summary.
- `code-reviewer` cites a `CLAUDE.md` section or rules file for every comment; anything else is an `[opinion]` that never blocks.
