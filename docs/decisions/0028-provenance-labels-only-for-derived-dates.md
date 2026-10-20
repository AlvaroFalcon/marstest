# 0028. Provenance labels only where a date is not plain carrier data

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

Earlier versions labelled many dates as "Confirmed", and several legends explained the labels. The word "Confirmed" was ambiguous, and the user noted that "in transit" is not inferred from GPS.

## Options considered

1. **Label every date and keep the legends** (previous version). Replaced.
2. **Label only dates that are not plain carrier data** (proposed by Claude, chosen):
   - Past milestones reported by the carrier carry no label.
   - Future dates keep "Carrier ETA" or "Estimated · N %".
   - System-derived insights say "Derived from GPS".
   - "Reported by carrier" replaces "Confirmed".

## Decision

Apply option 2. Legends are removed from the customer journey, the tables and the inbox. Ops keep only "Click/Tap a step to see its source events".

The user's words: "the proposal looks good, do it".

## Consequences

- Any new label must be justified by the date being non-carrier data.
- "Derived from GPS" must not be used for statuses such as "in transit".
