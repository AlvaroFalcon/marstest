# 0052. Status rule labels use the seed format "pattern → status label"

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, [0046](0046-status-rules-per-carrier.md)

## Context

Status rules (see [0046](0046-status-rules-per-carrier.md)) must be shown to users, so each rule needs a label. The seed data already uses a text format for rule labels.

## Options considered

1. **Seed format: "pattern → status label"** (proposed by Claude, recommended).
2. **Rule id** (for example `carrierA.customsHold.1`).

## Decision

Label each status rule with the seed format (pattern → status label), for example the matched raw text followed by the internal status label.

Reason (option description chosen by the user): "seed format (recommended)". No free-text reason was given.

## Consequences

- Labels match the seed data, so no migration of seeded labels is needed.
- Rule ids are not exposed, so renaming a rule's pattern changes its label.
