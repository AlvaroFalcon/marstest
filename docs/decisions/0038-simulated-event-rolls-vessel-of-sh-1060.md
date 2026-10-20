# 0038. "Simulate carrier event" rolls the vessel of SH-1060

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M2 and M15)

## Context

The plan did not name which shipment the "Simulate carrier event" demo action changes. The first M2 implementation seeded SH-1060 already rolled and made the simulation roll SH-1047. The mockups show the new event as "SH-1060 · Bilbao → Le Havre · vessel rolled", and SH-1047 as the "No recent update" shipment.

Reason the user gave: "it makes sense and that way we see the change" (translated from Spanish).

## Options considered

1. **SH-1060 starts on track and the simulation rolls its vessel** (proposed by Claude) — the seed has SH-1060 Bilbao → Le Havre on the sea leg with Mareline and no exception; the simulation adds a raw event, a vesselRolled milestone, a revised carrier ETA and estimate, and a vesselRolled exception with a customer draft for Brenner Iberia (PO 4500-1203). SH-1047 becomes a normal shipment with no recent update. Chosen by the user.
2. **Keep the first implementation** — SH-1060 is seeded already rolled and the simulation rolls SH-1047.

## Decision

SH-1060 is seeded on track and the "Simulate carrier event" action rolls its vessel. SH-1047 is a normal shipment with no recent update.

## Consequences

- Before the simulation, the seed has no rolled vessel; the rolled-vessel scenario is shown only through the simulated event.
- The exceptions inbox starts with 6 exceptions (5 in the ops scope) and gains one after the simulation.
- Matches the mockups.
