# 0064. Four app-shell technical recommendations accepted together

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4, M13), `docs/implementation/2026-10-20-shipment-visibility-prototype.md` (M2 follow-up)

## Context

Claude proposed four technical recommendations for the M4 app shell. The user was offered either to accept them together or to discuss each one individually, and chose to accept them all.

Reason not stated.

## Options considered

1. **Accept all four together** (proposed by Claude, chosen).
2. **Discuss each one individually.**

The four recommendations:

- **(a)** Provide the shipments API through a React context now, so tests can inject their own instance. This resolves the M2 follow-up in the implementation log.
- **(b)** An unknown customer id in the URL renders "Page not found" inside the app shell.
- **(c)** Switching role from a detail page goes to the target role's list page; ops keeps its current tab.
- **(d)** Tab counts are hidden (skeleton) while loading or on error, never showing a wrong number.

## Decision

Accept recommendations (a) to (d) as proposed.

## Consequences

- (a) Hooks read the API from context; each test injects its own instance, avoiding shared state.
- (b) Unknown customer ids show "Page not found" within the shell, consistent with the M13 rule that another customer's shipment shows not found.
- (c) Role switching from a detail page does not keep the detail URL for the new role.
- (d) Counts from [0061](0061-ops-tab-counts-ignore-site-filter.md) appear only once loaded and never show a placeholder number.
