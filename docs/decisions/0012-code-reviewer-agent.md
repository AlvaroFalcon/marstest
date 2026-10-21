# 0012. Code reviewer agent

- **Date:** 2026-10-19
- **Status:** Accepted · partially superseded by [0041](0041-single-coordinated-review-on-ready-label.md)
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `.claude/agents/code-reviewer.md`

## Context

Part of the handbook gaps the user decided to adopt. The QA agent validates behaviour in the running app, but nothing reviewed the code itself; the handbook describes a PR code reviewer agent.

## Options considered

1. **Human review only.**
2. **`code-reviewer` agent applying the MarsBased review checklist before human review** (proposed by Claude).

## Decision

Add a read-only `code-reviewer` agent that drafts reviews and posts them on the PR only when asked.

## Consequences

- Pull requests get a code review (`code-reviewer`) and a behaviour validation (`qa-reviewer`).
