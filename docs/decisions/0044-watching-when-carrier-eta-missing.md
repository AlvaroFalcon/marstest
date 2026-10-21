# 0044. Shipments without a carrier ETA are always "watching"

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

Some shipments have no carrier ETA (SH-1044 in the seed). The delay classification uses the carrier ETA as its reference, so the case without one needs a rule. The 75 % threshold from [0027](0027-seventy-five-percent-confidence-threshold.md) still applies to shipments that have a carrier ETA.

## Options considered

1. **Compare against `plannedDeliveryAt`** (proposed by Claude, recommended).
2. **Always "watching"** — chosen.
3. **Use the planned date as the baseline for all shipments.**

## Decision

When the carrier provides no ETA, the shipment is always classified as "watching", regardless of our estimate. The full classification is:

- Carrier ETA present, estimate in line: on track.
- Carrier ETA present, deviation with confidence below 75 %: watching.
- Carrier ETA present, deviation with confidence of 75 % or more: predicted delay.
- Delivered: on track.
- No carrier ETA: watching.

Reason (option description chosen by the user): "without a carrier ETA we cannot confirm". No free-text reason was given. This option was chosen against Claude's recommendation.

## Consequences

- A shipment without a carrier ETA never opens a predicted-delay exception, even at high confidence.
- The planned delivery date is not used as a baseline for classification.
- Shipments such as SH-1044 show "watching" with a suggested step to ask the carrier to confirm (see [0048](0048-ai-text-only-for-new-texts.md)).
