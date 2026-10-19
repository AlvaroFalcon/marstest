# 0007. QA agent validates every pull request from a Claude Code routine

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `.claude/agents/qa-reviewer.md`

## Context

The user wanted a QA agent that, when a pull request is opened, tests the real application, takes screenshots to prove the acceptance criteria are met, and comments on the same pull request when something is wrong. Asked about the runtime, the user chose a Claude Code routine over GitHub Actions:

> "It won't run in a GitHub Actions workflow; I will set up a Claude Code routine that triggers when a pull request is opened in the repository." (translated)

## Options considered

1. **GitHub Actions workflow** — runs inside CI.
2. **Claude Code routine triggered by the pull request** — runs unattended with Claude Code's tools.

## Decision

Run `qa-reviewer` from a Claude Code routine on every opened or updated pull request. It validates the acceptance criteria in the running app and reports on the PR.

## Consequences

- The agent never asks questions: it reports blockers in its PR comment.
- The routine needs write access to the repository to comment and publish screenshots (see ADR 0008).
