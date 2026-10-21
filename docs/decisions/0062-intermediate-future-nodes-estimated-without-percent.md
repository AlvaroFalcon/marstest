# 0062. Intermediate future journey nodes show "Estimated" without a percentage

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M6), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/journey`; see also [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md) and [0028](0028-provenance-labels-only-for-derived-dates.md)

## Context

Future journey nodes between places carry a planned date from the leg. These dates are not carrier-confirmed, so they need a provenance label (see [0028](0028-provenance-labels-only-for-derived-dates.md)). The M6 plan allowed "Estimated · N%" on future dates. Confidence is calculated for the shipment's final ETA (see [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md)).

## Options considered

1. **Leg planned date with an "Estimated" badge, no percentage** (proposed by Claude, recommended, chosen). The confidence belongs to the final ETA only.
2. **"Estimated · N%" on every future node.**
3. **No date on intermediate nodes.**

## Decision

Intermediate future nodes show the leg planned date with an "Estimated" badge and no percentage. The user selected the recommended option without further comment.

Reason not stated.

## Consequences

- Percentages appear only on the final delivery node and in the estimate card (`EtaPair`).
- The M6 acceptance wording "future dates show 'Carrier ETA' or 'Estimated · N %'" applies to the final node; intermediate future nodes use "Estimated" alone.
- The percentage is not repeated on intermediate nodes, so a reader cannot take it as a confidence for each leg.
