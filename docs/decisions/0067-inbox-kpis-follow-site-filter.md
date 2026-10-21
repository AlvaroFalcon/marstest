# 0067. Inbox KPIs follow the site filter

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M7), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/exceptions-inbox`; see also [0066](0066-on-time-kpi-counts-all-scoped-shipments.md), [0051](0051-out-of-scope-site-visible-to-operations-only.md)

## Context

The exceptions inbox has a site filter stored in `?site=`. The ops user can see several sites. The KPIs ("Need attention", "Stale > 24 h", "On time") could either follow the active site filter or always cover all of the user's sites. Tab counts and per-site counts in the filter are not part of this choice.

The user answered the question dialog by choosing "Yes, follow filter (Recommended)". No free-text reason was given.

## Options considered

1. **KPIs follow the `?site=` filter** (proposed by Claude, recommended, chosen).
2. **KPIs always cover all of the user's sites.**

## Decision

The inbox KPIs are calculated over the sites selected by the `?site=` filter. Tab counts and per-site counts in the filter stay unfiltered. Reason not stated.

## Consequences

- With a site selected, the KPIs describe that site only; the tab counts and site counts still describe the whole scope, so the two can differ on screen.
- The KPI logic must read the site filter from the URL, so the inbox state stays shareable through the URL.
- The out-of-scope site stays hidden from operations users outside that scope, as set in [0051](0051-out-of-scope-site-visible-to-operations-only.md).
