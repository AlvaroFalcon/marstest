# 0060. Pull requests are opened after verification, without a review stop before pushing

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `.claude/skills/implement-milestone/SKILL.md` (steps 6–7 merged into "Commit, push and open the pull request"), `CLAUDE.md` §10 and §12. Partially supersedes [0041](0041-single-coordinated-review-on-ready-label.md).

## Context

ADR 0041 recorded that the user reviews the code before the pull request is opened:

> "Pre-PR I will review it myself, the agent does it on the PR" (translated)

As a result, the `implement-milestone` skill stopped after committing and waited for the user's go-ahead before pushing and opening the pull request. The user then asked to change the skill:

> "also edit the implement milestone skill, avoid asking me to review it before pushing, it is delaying us and is extra tokens, i will review PRS."

## Options considered

1. **Keep the pre-PR review stop** — the user reviews the commit before the branch is pushed and the pull request is opened (status quo, ADR 0041).
2. **Push and open the pull request right after verification** — build, lint and tests (and `test:e2e` when needed) must pass; the user reviews the pull request on GitHub.

## Decision

The user chose option 2. The `implement-milestone` skill pushes and opens the pull request as soon as verification passes, with no separate review before pushing. The user reviews the pull request. The `ready-to-test` label rule from ADR 0041 is unchanged.

## Consequences

- Faster delivery and fewer tokens: no waiting for a pre-push go-ahead.
- Review happens on the pull request instead of on the local commit.
- The part of ADR 0041 that says the user reviews the code before opening the pull request is replaced by this ADR. Its other parts (one coordinated review triggered by the `ready-to-test` label) still hold.
