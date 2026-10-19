# 0008. QA screenshots stored in an orphan branch and embedded in PR comments

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `.claude/agents/qa-reviewer.md`

## Context

The user asked whether the QA agent could upload screenshots directly into its PR comments. The GitHub API and `gh` cannot attach images to comments, so Claude proposed alternatives and the user adopted the orphan-branch approach: "yes, change the QA reviewer then, adapt it for a routine" (translated).

## Options considered

1. **Browser automation dragging images into the comment** — needs a logged-in session, fragile.
2. **External image hosting** — leaks screenshots of a private repository.
3. **Orphan branch `qa-screenshots` in the same repository** (proposed by Claude) — images stay private and render inline.

## Decision

Push screenshots to the `qa-screenshots` branch and embed them in a single QA comment per pull request, updated on each run.

## Consequences

- The `qa-screenshots` branch grows over time and should be pruned periodically.
