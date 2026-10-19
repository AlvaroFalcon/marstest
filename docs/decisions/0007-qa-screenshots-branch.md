# 0007. QA screenshots stored in an orphan branch and embedded in PR comments

- **Date:** 2026-10-19
- **Status:** Accepted
- **Phase:** Plan
- **Related:** `.claude/agents/qa-reviewer.md`

## Context

`qa-reviewer` runs from a Claude Code routine when a pull request is opened and must show screenshots inside its PR comment. The GitHub REST API and `gh` cannot attach images to comments (drag-and-drop uses an internal endpoint tied to a browser session).

## Options considered

1. **Browser automation to drag images into the comment box** — needs a logged-in GitHub session, fragile, unavailable in a cloud routine.
2. **External image hosting** — would leak screenshots of a private repository to a third party.
3. **Orphan branch `qa-screenshots` in the same repository** — images stay private to repository members and render inline.

## Decision

Push screenshots to `qa-screenshots` under `pr-<number>/<head-sha>/` and embed them with `blob/<commit-sha>/...?raw=true` URLs pinned to the screenshot commit. One QA comment per PR, updated on each run.

## Consequences

- The routine needs write access to the repository.
- The `qa-screenshots` branch grows over time; prune old PR folders periodically.
