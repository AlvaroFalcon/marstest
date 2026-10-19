# 0013. Pull request checks workflow and a DevOps agent

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `.github/workflows/pr-checks.yml`, `.claude/agents/devops-expert.md`

## Context

The user asked for a DevOps agent that implements the workflows the user requests, starting with:

> "a workflow launched on every opened pull request that checks the tests, the build and the lint of the project." (translated)

## Options considered

1. **No CI** — checks depend on each developer running them.
2. **GitHub Actions workflow on every pull request**, implemented by a dedicated `devops-expert` agent.

## Decision

Add `pr-checks.yml` running Lint, Build, Unit tests and E2E tests on every pull request, and a `devops-expert` agent for future workflows.

## Consequences

- To block merging on failures, the four checks must be marked as required in the branch protection of `main` (manual GitHub setting).
