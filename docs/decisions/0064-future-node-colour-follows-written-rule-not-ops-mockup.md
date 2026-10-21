# 0064. Future journey nodes use the written colour rule, not the Ops 5 mockup

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M6), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/journey`; see also [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md) and [0056](0056-pause-m4-and-rebuild-lost-design.md)

## Context

The rebuilt Pencil design for the ops shipment detail (Ops 5) shows future journey nodes with a green outline and a green badge. The written rule for the journey is different: blue marks a deviation (see [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md)), and green marks a completed step. [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md) had already removed the green check from the carrier ETA. A green future node could be read as a confirmed fact.

## Options considered

1. **Future nodes always have a blue outline, the "Carrier ETA" badge is neutral, and green is used only for done nodes** (proposed by Claude, recommended, chosen).
2. **Follow the Ops 5 mockup:** green outline and green badge on future nodes.
3. **Outline colour by provenance.**

## Decision

Future nodes always have a blue outline, the "Carrier ETA" badge is neutral, and green is used only for done nodes. This overrides the Ops 5 mockup for future nodes. The user selected the recommended option without further comment.

Reason not stated. The rationale shown in the question was: green is reserved for done, so a carrier ETA never reads as a fact.

## Consequences

- The Ops 5 mockup is not followed for future-node colour; the implementation does not match it on this point.
- Status is still conveyed by text as well as colour, as required by the plan.
- Any future design change to green future nodes needs a new decision that supersedes this one.
