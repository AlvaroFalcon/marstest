# 0051. The out-of-scope Lyon site is visible to operations only

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

The seed contains three in-scope sites and one out-of-scope site (Lyon). M3 implements scoping in `src/lib/scope`. Customers and operations need different visibility rules, and the prototype has no customer-safe projection.

## Options considered

1. **Operations only** (proposed by Claude, recommended). Ops see shipments from `inOpsScope` sites; customers see all their shipments, including Lyon.
2. **Both roles see the out-of-scope site with the same rules** (no separate ops-only rule).

## Decision

Operations see shipments from sites flagged `inOpsScope` in the inbox and in All shipments. The `?site=` filter narrows within that scope. Customers see all shipments with their `customerId`, including Lyon. No customer-safe projection is built in M3.

Reason (option description chosen by the user): "ops only (recommended)". No free-text reason was given.

## Consequences

- Operations never see the Lyon site in their views.
- Customers can see Lyon shipments, so the prototype does not model a customer-safe data projection.
- A real customer-safe projection is not part of this prototype and must be revisited if the write-up or a later phase requires it.
