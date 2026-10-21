# 0043. Tracking freshness has two levels, measured from the last received event

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

M3 derives a freshness value for each shipment's tracking data. The "stale > 24 h" KPI already uses the 24 hour threshold, so freshness must match it. The freshness clock needs a reference timestamp, and delivered shipments need a rule.

## Options considered

1. **Two levels, from `receivedAt`** (proposed by Claude, recommended) — fresh ≤ 24 h, stale > 24 h.
2. **Three levels, with an "aging" band** (12–24 h).
3. **Two levels, from `occurredAt`.**

## Decision

Freshness has two levels, measured from the latest raw event or milestone `receivedAt`: **fresh** when 24 hours or less have passed, **stale** when more than 24 hours have passed. Delivered shipments are not applicable and are never stale.

Reason (option description chosen by the user): "2 levels receivedAt (recommended)". No free-text reason was given.

## Consequences

- The stale state uses the same 24 hour threshold as the stale KPI.
- Measuring from `receivedAt` means a late-arriving event refreshes freshness even when its `occurredAt` is older.
- No "aging" level exists in the prototype.
