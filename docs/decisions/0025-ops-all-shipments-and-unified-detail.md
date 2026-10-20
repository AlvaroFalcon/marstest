# 0025. Operations keep an "All shipments" view and one shipment detail component

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The brief says operations see a portfolio across sites. Claude proposed that the exception detail and the shipment detail are the same component, with an exception layer added. The UI/UX audit later suggested cutting the operations table ("All shipments").

## Options considered

1. **Exceptions inbox only,** without a portfolio table. Suggested for removal by the UI/UX audit.
2. **Exceptions inbox plus "All shipments" table** (kept).
3. **Separate components for exception detail and shipment detail** (not chosen).
4. **One detail component with an exception layer** (proposed by Claude, chosen). The Ops 1 detail aligns with Ops 4: internal data row plus an exception badge.

## Decision

Keep the "All shipments" table and build the exception detail and shipment detail as one component with an exception layer.

The user's words when the audit suggested the cut: "I wouldn't remove it".

## Consequences

- The three ops shipment states and the exception detail are one data-driven component.
- The operations table is a second use of the shared table component.
