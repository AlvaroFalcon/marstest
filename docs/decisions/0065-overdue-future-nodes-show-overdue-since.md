# 0065. Overdue future journey nodes show "Overdue since <date>"

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M6), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/journey`; see also [0064](0064-future-node-colour-follows-written-rule-not-ops-mockup.md)

## Context

A future journey node whose date has passed is still a future node: the shipment has not reached that place. Showing the past date unchanged leaves the node looking like a normal future date. The plan requires that status is never conveyed by colour alone.

## Options considered

1. **Show "Overdue since <date>"** (proposed by Claude, recommended, chosen). `<date>` is the node's date.
2. **Keep the past date as it is.**

## Decision

An overdue future node shows "Overdue since <date>". The user selected the recommended option without further comment.

Reason not stated.

## Consequences

- The overdue state is conveyed by text, not only by colour.
- Overdue nodes need a rule for what counts as overdue (the node's date before the demo clock); this detail is an implementation choice of Claude's and is not part of this decision.
- The label is one more provenance-style label and must still follow [0028](0028-provenance-labels-only-for-derived-dates.md).
