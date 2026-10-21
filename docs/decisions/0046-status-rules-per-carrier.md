# 0046. Raw carrier status text is normalised with rule tables per carrier

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

Each carrier reports status as free text (raw events). M3 must map this text to the internal status. When no rule matches, the seeded AI mapping and its confidence are used; a confidence below 70 % is flagged for review.

## Options considered

1. **One global ordered regex table** (proposed by Claude, recommended).
2. **Per-carrier rule tables**, keyed by carrier id and matched on raw text — chosen.
3. **Read the stored mapping only**, with no rules.

## Decision

Keep a separate rule table for each carrier, keyed by carrier id and matched on the raw status text. If no rule matches, use the seeded AI mapping with its confidence; mappings below 70 % are flagged for review.

Reason (option description chosen by the user): "per-carrier tables". No free-text reason was given. This option was chosen against Claude's recommendation.

## Consequences

- Each carrier's wording can differ without affecting the others.
- Adding a carrier requires a new rule table.
- The global table option, which would have been simpler to maintain, was not adopted.
