# 0035. Delivery in small feature milestones, one branch and one pull request each

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md`, `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

Claude first proposed splitting the plan into about six chunks, each with one pull request. On reviewing the plan, the user asked for finer granularity.

The user's words (quoted as written): "Can we structure the plan into different milestones, each one with its own acceptance criteria? With smaller milestones PRs are more focused and concise, easier to encounter issues and to test-QA. Do it per small features."

## Options considered

1. **One feature branch with one pull request** — the whole prototype reviewed at once.
2. **About six chunks, one pull request each** (proposed by Claude) — the first split presented.
3. **Small feature milestones, one branch and one pull request each, each with its own acceptance criteria** — chosen by the user.

## Decision

The prototype is delivered as small feature milestones (M1 to M17), each on its own branch and pull request, each with its own acceptance criteria.

## Consequences

- Pull requests are smaller and easier to review, QA and roll back.
- Issues are easier to locate because each milestone has a narrow scope.
- Each milestone requires its own `create-pull-request` run, `code-reviewer` pass and `qa-reviewer` validation, so the number of review cycles grows with the count of milestones.
- Milestone order follows dependencies and must be respected when branching.
