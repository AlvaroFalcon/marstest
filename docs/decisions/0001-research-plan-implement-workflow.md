# 0001. Research → Plan → Implement workflow with Claude Code agents and skills

- **Date:** 2026-10-19
- **Status:** Accepted
- **Phase:** Plan
- **Related:** `CLAUDE.md` §3, §11, §12

## Context

Development is AI-augmented with Claude Code. Unstructured prompting produces inconsistent code and loses the reasons behind decisions. The MarsBased AI-augmented development guide recommends the RPI framework, a project `CLAUDE.md`, skills for repetitive workflows and subagents for isolated tasks.

## Options considered

1. **Free-form prompting** — no overhead, but no traceability and inconsistent output.
2. **RPI with documents per phase, specialised agents and skills** — some overhead per feature, full traceability.

## Decision

Adopt RPI with one document per phase (`docs/research`, `docs/plans`, `docs/implementation`) sharing a slug, ADRs in `docs/decisions`, six agents (`react-vite-expert`, `ui-ux-expert`, `test-expert`, `code-reviewer`, `qa-reviewer`, `decision-recorder`) and two skills (`design-patterns`, `create-pull-request`).

## Consequences

- Every feature leaves a research/plan/implementation trail that makes final documentation cheap.
- Small changes may skip RPI; the threshold is judgement ("non-trivial change").
- Agents and skills must be kept in sync with `CLAUDE.md` when conventions change.
