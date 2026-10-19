# 0015. Visual evidence is the QA agent's responsibility only

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** PR #1

## Context

The code reviewer flagged that the pull request body had no Screenshots section, although the QA agent had already posted screenshots of every page on the same pull request. The user decided:

> "Remove that responsibility from the reviewer, it should belong only to QA." (translated)

## Options considered

1. **Screenshots in the PR body (author) and checked by the reviewer** — duplicated evidence, extra work per PR.
2. **Screenshots only from `qa-reviewer`** — one source of visual evidence, taken from the running app.

## Decision

Only `qa-reviewer` takes and publishes screenshots. The PR template has no Screenshots section and `code-reviewer` never asks for or checks visual evidence.

## Consequences

- `create-pull-request` no longer asks the author for screenshots.
- Visual evidence of a PR lives in the QA comment.
