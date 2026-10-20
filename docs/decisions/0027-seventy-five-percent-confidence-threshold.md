# 0027. 75 % confidence threshold separates watching from predicted delay

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The prototype must decide when a predicted delay becomes an exception and a customer notice. 

## Options considered

1. **Threshold %.** Below it, the shipment is "Watching"; at or above it, an exception opens. Accepted.

## Decision

Use a 75 % confidence threshold:

- **Below 75 %:** status "Watching", no customer alert, and a suggested low-cost step (ask the carrier to confirm).
- **At or above 75 %:** the exception is opened automatically and a customer notice is drafted for review.

The user's words: "Let´s make that threshold 75, I think it make sense for now."


## Consequences

- The threshold is a single value in the mock logic, documented for the written document.
- Customer notices are only drafted, never sent without approval (see [0018](0018-prototype-ai-feature-set.md)).
