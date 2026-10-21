# 0047. Document check compares HS codes by digits and gross weight within 1 %

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, [0020](0020-document-validation-ops-only-no-incoterms.md)

## Context

Operations validate shipment documents against the shipment data (see [0020](0020-document-validation-ops-only-no-incoterms.md)). M3 must define how the HS code and gross weight are compared, and how documents not yet received are reported.

## Options considered

1. **Normalised HS code and gross weight within ±1 %** (proposed by Claude, recommended).
2. **Exact match.**

Pending documents are reported as a separate "pending" finding, and every received document is compared.

## Decision

Compare HS codes digits only (separators and spacing are ignored). Compare gross weight within ±1 %. Report documents not yet received as a separate "pending" finding, not as a mismatch. Compare every received document.

Reason (option description chosen by the user): "normalised + 1 % (recommended)". No free-text reason was given.

## Consequences

- Formatting differences in HS codes do not produce false mismatches.
- Small weight rounding differences are accepted.
- Exact matching was not adopted, so a one-digit weight difference beyond 1 % is still a mismatch.
