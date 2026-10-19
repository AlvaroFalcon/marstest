# 0003. Research → Plan → Implement workflow with specialised agents and skills

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `CLAUDE.md` §3, §11, §12, `docs/`

## Context

The user wanted a structured AI-augmented workflow instead of ad-hoc prompting:

> "We are going to use the research-plan-implement framework, so prepare that folder structure too." (translated)

The user also defined the agents (React/Vite expert, UI/UX expert, test expert, QA, decision recorder) and skills (classic design patterns, pull request creation), and asked for all of them to be described in a table in `CLAUDE.md` with when to use them.

## Options considered

1. **Free-form prompting** — no overhead, no traceability.
2. **RPI with one document per phase and specialised agents and skills** — some overhead per feature, full traceability.

## Decision

Adopt RPI with `docs/research`, `docs/plans` and `docs/implementation` (one document per phase sharing a slug), ADRs in `docs/decisions`, the agents and skills the user listed, and a table of agents and skills in `CLAUDE.md`.

## Consequences

- Every feature leaves a research → plan → implementation trail.
- Agents and skills must be kept in sync with `CLAUDE.md` when conventions change.
