# 0045. Exceptions are ordered by type rank, then by age, then by shipment id

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

The exceptions inbox lists open exceptions of several types (customs hold, incident, rolled vessel, predicted delay, stale tracking). M3 must define the order in which they are shown and handled.

## Options considered

1. **Type rank, then age** (proposed by Claude, recommended).
2. **Deadline first.**
3. **Weighted score.**

## Decision

Sort open exceptions by type rank, highest first: customs hold, incident, rolled vessel, predicted delay, stale tracking. Within the same type, the oldest `openedAt` comes first. Ties are broken by shipment id.

Reason (option description chosen by the user): "type rank then age" (recommended). No free-text reason was given.

## Consequences

- The order is deterministic and needs no tuning values.
- A deadline or weighted score is not used, so a shipment's delivery date does not change its position.
- The rank list must be updated if a new exception type is added.
