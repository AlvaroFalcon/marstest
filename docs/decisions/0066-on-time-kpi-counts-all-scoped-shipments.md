# 0066. The "On time" inbox KPI counts all scoped shipments, delivered included

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M7), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/exceptions-inbox`; see also [0067](0067-inbox-kpis-follow-site-filter.md)

## Context

The exceptions inbox shows three KPIs: "Need attention", "Stale > 24 h" and "On time". The plan requires them to be consistent with the seed. The definition of "On time" had two valid denominators: all shipments in the ops user's scope, or only the shipments that are not yet delivered. The two give different numbers on the seed (9 of 16 versus 7 of 14).

The user answered the question dialog by choosing the option "All scoped, 9 of 16 (Recommended)". No free-text reason was given.

## Options considered

1. **All scoped, 9 of 16** (proposed by Claude, recommended, chosen). "On time" = shipments with on-track status over all ops-scoped shipments, delivered ones included.
2. **Undelivered only, 7 of 14.** "On time" = on-track status over shipments not yet delivered.

Other KPI definitions accepted as defaults, not separately chosen by the user: "Need attention" = open exceptions in scope; "Stale > 24 h" = stale freshness over all scoped shipments.

## Decision

The "On time" KPI is computed over all ops-scoped shipments, including delivered ones (9 of 16 on the seed). Reason not stated.

## Consequences

- The "On time" figure includes delivered shipments, so it rises as shipments are delivered and is not a measure of the open workload alone.
- "Need attention" and "Stale > 24 h" keep their default definitions above; changing them would be a separate decision.
- The site filter does not change this rule; see [0067](0067-inbox-kpis-follow-site-filter.md).
