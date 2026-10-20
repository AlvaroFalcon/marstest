# 0031. Keep the agreed mock data volume

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The agreed seed for the prototype is 15–20 synthetic shipments for 3 customers. The Pencil mockups show larger counts: "142" ops shipments and "24" customer shipments. The two do not match, so the counts shown in the UI would either need more seed data or different numbers.

The user's words (translated): "for data volume we'll keep what we agreed, the mockup is just an example" (translated).

## Options considered

1. **Seed more data** to match the mockup counts.
2. **Change the counts shown** so they match the 15–20 seed (proposed by Claude, which recommended this option).
3. **Keep the agreed seed** and treat the mockup counts as illustrative (chosen).

## Decision

The prototype keeps the agreed seed of 15–20 synthetic shipments for 3 customers. The counts in the mockups ("142", "24") are examples only and are not a data requirement.

## Consequences

- Mock data stays small, which fits the 8-hour budget.
- The counts displayed in the implemented UI follow the seed, not the mockup labels.
- Claude's recommended option (option 2) was not adopted; the mockup numbers are not reproduced.
