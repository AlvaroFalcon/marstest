# 0050. Current status comes from the latest milestone by occurrence time

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

A shipment has several milestones. M3 must decide which one defines the current status shown to users. Milestones can be recorded out of order.

## Options considered

1. **Latest milestone by `occurredAt`, tie-break `receivedAt`** (proposed by Claude, recommended).
2. **Furthest along the journey.**

## Decision

The current status is the latest milestone by `occurredAt`. If two milestones share the same `occurredAt`, the one with the later `receivedAt` wins.

Reason (option description chosen by the user): "latest milestone (recommended)". No free-text reason was given.

## Consequences

- Status follows real-world time, so a late-recorded earlier milestone does not move the shipment backwards.
- A shipment can show a status earlier in the journey than a milestone already recorded, if that is what the latest occurrence says.
- The furthest-along option was not adopted.
