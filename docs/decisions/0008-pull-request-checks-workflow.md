# 0008. Pull request checks with GitHub Actions and a devops-expert agent

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User (Claude chose the job layout)
- **Phase:** Implement
- **Related:** `.github/workflows/pr-checks.yml`, `.claude/agents/devops-expert.md`, `.nvmrc`

## Context

The handbook requires the full test suite to pass on every pull request before merging. CI workflows will keep growing (deploys, scheduled jobs), so their implementation is delegated to a dedicated `devops-expert` agent.

## Options considered

1. **One job running lint, build and tests sequentially** — simpler file, but the first failure hides the others and the PR checks list shows a single entry.
2. **One job per check, in parallel** — repeats checkout/install per job, but all failures are visible at once and the total time is the slowest job.

## Decision

`pr-checks.yml` runs on `pull_request` (opened, synchronize, reopened, ready_for_review) with four parallel jobs: `Lint`, `Build`, `Unit tests`, `E2E tests`. Actions are pinned to commit SHAs, permissions are `contents: read`, runs for the same PR cancel each other, Node comes from `.nvmrc` with the npm cache, Playwright browsers are cached per Playwright version and the report is uploaded only on failure.

## Consequences

- To block merging on failures, mark the four checks as required in the branch protection rules of `main` (manual GitHub setting).
- Pinned SHAs must be bumped deliberately (e.g. with Dependabot for `github-actions`).
