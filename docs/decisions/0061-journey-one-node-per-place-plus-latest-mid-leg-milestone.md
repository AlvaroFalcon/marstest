# 0061. Journey shows one node per place plus the latest mid-leg milestone

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M6), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/journey`

## Context

The journey is drawn as arrow-linked nodes (see [0024](0024-visual-journey-with-arrows.md)). A shipment can have many milestones between two places, so the journey needs a rule for which milestones become nodes. Full milestone history is also needed for the source events sheet (M10).

## Options considered

1. **One node per place along the legs, plus the latest mid-leg milestone** (proposed by Claude, recommended, chosen).
2. **One node per milestone.**

## Decision

The journey shows one node for each place along the legs and, between them, only the latest mid-leg milestone. The user selected the recommended option without further comment.

Reason not stated.

## Consequences

- The journey is shorter than the milestone list; mid-leg history is not drawn as nodes.
- The complete milestone history stays available through the source events sheet (M10), so it is not lost from the UI.
- Journey rendering must derive nodes from legs and the latest mid-leg milestone, not from every milestone.
