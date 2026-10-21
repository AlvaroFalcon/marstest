# 0063. Final delivery node shows the carrier ETA when in line, otherwise our estimate range

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M6), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/journey`; see also [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md) and [0042](0042-eta-in-line-within-two-hours.md)

## Context

The final delivery node is the one date a customer most looks at. Two sources exist: the carrier ETA and our estimate with its range and confidence. [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md) requires both to be visible in the estimate pair. The journey node must say which source it shows. "In line" is defined by the ±2 hour comparison in [0042](0042-eta-in-line-within-two-hours.md).

## Options considered

1. **Carrier ETA with "Carrier ETA" when our estimate is in line; otherwise our estimate range with "Estimated · N%"** (proposed by Claude, recommended, chosen).
2. **Always our estimate.**
3. **Always the carrier ETA.**

## Decision

The final delivery node shows the carrier ETA with the "Carrier ETA" badge when `compareEta` returns in line. Otherwise it shows our estimate range with "Estimated · N%". The user selected the recommended option without further comment.

Reason not stated.

## Consequences

- The node source depends on the in-line result, so a shipment can change its final-node source when the estimate moves away from the carrier ETA.
- When the carrier gives no ETA (`notProvided`), the node shows our estimate range with "Estimated · N%"; the option the user chose stated this case explicitly.
- The journey and the estimate pair can show different dates for the same shipment; the pair keeps showing both.
