# 0014. The decision log records only the user's decisions

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `.claude/agents/decision-recorder.md`, `docs/decisions/`

## Context

The decision log initially recorded technical decisions taken by Claude as well. The user narrowed its purpose:

> "Claude's decisions are not relevant in this log. I want to show my ability to make decisions, so Claude's can be omitted. However, if Claude offers me an idea and I decide to use it, that can be documented." (translated)

## Options considered

1. **Record every significant decision**, whoever took it.
2. **Record only the user's decisions**, including ideas proposed by Claude that the user adopted.

## Decision

`docs/decisions/` records only decisions taken by the user. Ideas proposed by Claude are recorded when the user adopts them, marked `User, on Claude's proposal`.

## Consequences

- Technical choices Claude makes on its own are documented where they apply (`CLAUDE.md`, code comments, commit messages), not here.
- The existing log was rewritten to remove Claude's own decisions and to add earlier user decisions that were missing.
