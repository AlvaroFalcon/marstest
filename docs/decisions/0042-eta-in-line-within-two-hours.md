# 0042. Our ETA counts as in line with the carrier within a fixed ±2 hours

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

M3 derives whether our estimated ETA deviates from the carrier ETA. The estimate must be shown next to the carrier date (see [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md)), so the tolerance decides when the UI shows "in line" (black) and when it shows "deviates" (blue).

## Options considered

1. **±2 h tolerance** (proposed by Claude, recommended) — `|estimate − carrier ETA| ≤ 2 h` is in line.
2. **±6 h tolerance.**
3. **Inside the estimate's earliest–latest range.**

## Decision

Use a fixed ±2 hour tolerance: an estimate whose absolute difference from the carrier ETA is 2 hours or less is "in line"; anything larger "deviates".

Reason (option description chosen by the user): "simple and explainable". No free-text reason was given.

## Consequences

- The tolerance is one constant in `src/lib/`, covered by unit tests.
- The range-based option was not chosen, so the estimate's spread does not affect the in-line check.
- The 2 hour value is a prototype choice and must be documented for the written document.
