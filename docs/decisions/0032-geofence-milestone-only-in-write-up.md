# 0032. Geofence-detected milestone only in the written document

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

A milestone detected by geofence ("Detected by geofence · not yet confirmed by carrier") is data that does not come from the carrier. The prototype already covers system-derived data with the "Derived from GPS" provenance label. Adding the geofence milestone as a screen example would extend the scope.

The user's words (translated): "I agree, we can't grow the scope much if we want to fit the time" (translated).

## Options considered

1. **Add it as a prototype example**, alongside the "Derived from GPS" label.
2. **Mention it only in the written document** (agreed; Claude's proposal).

## Decision

The geofence-detected milestone is not shown in the prototype. It is mentioned only in the written document, to keep the scope within the time budget.

## Consequences

- The prototype shows no geofence milestone state; the "Derived from GPS" label remains the only system-derived provenance example.
- The write-up must describe the geofence milestone as a production capability, not as a demonstrated feature.
- Follows the same pattern as [0021](0021-langgraph-only-in-write-up.md).
