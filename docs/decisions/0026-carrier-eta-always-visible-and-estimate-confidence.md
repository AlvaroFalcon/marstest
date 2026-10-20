# 0026. Carrier ETA is always visible and our estimate always shows a date and confidence

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

An early version showed only whether our estimate matched the carrier. The user wanted both dates visible.

## Options considered

1. **"Matches carrier" indicator instead of our date.** Rejected.
2. **Carrier ETA always present, and our estimate shown as a date with a confidence value** (chosen).

## Decision

The carrier ETA is always shown. Our estimate always shows a date and a confidence value. Black means in line with the carrier, blue means it deviates. Confidence is a sortable column in tables. Redundant "Confirmed" badges and the green check on the carrier ETA are removed.

The user's words: "I'd like the carrier ETA to always be present" and "I don't see our estimate, only whether it matches the carrier" (translated). On confidence: "to sort by reliability" and "so columns have the same size" (translated). On the badges: "remove it from there, it's redundant" (translated).

## Consequences

- Confidence is a column in its own right, so tables keep equal column widths.
- Confidence is displayed as a percentage (see [0022](0022-prototype-screen-set-and-demo-interactions.md)) and the 75% threshold applies (see [0027](0027-seventy-five-percent-confidence-threshold.md)).
