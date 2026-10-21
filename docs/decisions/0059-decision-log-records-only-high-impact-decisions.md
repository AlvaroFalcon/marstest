# 0059. The decision log records only high-impact user decisions

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/decisions/0014-decision-log-records-user-decisions.md`, `.claude/agents/decision-recorder.md`, `.claude/skills/implement-milestone/SKILL.md`, `CLAUDE.md` §3 and §11, PR #8

## Context

The decision recorder created too many records. M4 alone produced 8 ADRs, mostly about UI placement, copy and small recommendations the user accepted. The user asked for a narrower scope:

> "decision recorder is taking a lot of notes, can we restrict it more to record more impact things or tradeoffs? or a technology swap, etc..."

ADR 0014 limits the log to the user's decisions but does not limit which of them are worth a record. This ADR narrows it further.

## Options considered

1. **Impact test (chosen, proposed by Claude).** Record a user decision only if a newcomer would need it to understand why the project is the way it is, and undoing it would take more than a small PR. This covers: technology, library or service added, removed or swapped; architecture that later work depends on; scope added or cut; a real trade-off with different cost or risk; workflow or convention changes; business rules; reversals of an earlier ADR. Small gate decisions (UI placement, copy, styling, accepting a recommended detail, review suggestions, easily changed values) go as one line in the implementation log.
2. **Stricter filter (proposed by Claude).** Record only technology swaps, architecture and scope changes. Business rules and workflow changes would then go to the implementation log.

## Decision

The user chose option 1. The decision recorder writes an ADR only for user decisions that pass the impact test above. Smaller gate decisions are logged as "gate decisions without ADR" in the implementation log. The recorder lists any decision below the bar in its final report instead of recording it.

## Consequences

- Fewer ADRs. Small decisions stay visible in the implementation log.
- `implement-milestone` sends the recorder only high-impact decisions.
- The recorder must report, not record, decisions below the bar, so the user can override the filter.
- ADRs 0001 to 0056 are unchanged.
- Unmerged M4 ADRs on PR #8 were reviewed against this rule. Small ones were removed and their content moved to the implementation log. That retroactive cleanup is a separate decision and is not recorded here.
