# 0011. Claude Code hooks and scoped rules

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `.claude/settings.json`, `.claude/hooks/`, `.claude/rules/`

## Context

Part of the handbook gaps the user decided to adopt. The handbook's AI-augmented development guide recommends hooks for hard rules and `.claude/rules/` for file-specific instructions.

## Options considered

1. **Instructions in `CLAUDE.md` only** — Claude may forget or skip them.
2. **Hooks and scoped rules** (proposed by Claude, from the handbook) — rules enforced outside Claude's context.

## Decision

Add a hook that blocks access to secret files, a hook that auto-fixes lint after every edit, and scoped rules for tests, UI components, pages/routing and lib/hooks/api.

## Consequences

- Claude cannot read local secrets even when asked; developers edit their environment files themselves.
