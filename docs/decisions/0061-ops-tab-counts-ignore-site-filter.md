# 0061. Ops tabs show two counts that ignore the site filter

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4, M7, M11), [0025](0025-ops-all-shipments-and-unified-detail.md), [0031](0031-keep-agreed-mock-data-volume.md), [0051](0051-out-of-scope-site-visible-to-operations-only.md)

## Context

The ops tabs "Exceptions" and "All shipments" can show counts. The desktop mockup shows "142" for ops shipments, which does not match the seed. The Lyon site is out of scope for operations' exceptions (ADR 0051). The inbox has a site filter (M7).

Reason not stated.

## Options considered

1. **Both counts, neither follows the site filter** (proposed by Claude, marked Recommended):
   - "Exceptions": open exceptions on in-scope Spain-site shipments; Lyon excluded.
   - "All shipments": shipments in ops scope, using the seed number, not the mockup's 142.
2. **Exceptions count only.**
3. **Both counts follow the site filter.**

## Decision

The ops tabs show both counts: "Exceptions" and "All shipments". Neither count follows the site filter.

## Consequences

- Changing the site filter on the inbox does not change the tab counts.
- The counts come from seeded data, so the "142" in the mockup is not reproduced (see 0031).
- The "Exceptions" count excludes Lyon, consistent with 0051.
