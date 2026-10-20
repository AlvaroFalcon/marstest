# 0024. Shipment journey shown as arrow-linked nodes

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The first shipment journey was a list. The user asked for a more visual journey and chose between the list and an alternative shown in the mockups.

## Options considered

1. **List-style journey** (previous version). Replaced.
2. **Nodes joined by arrows:** horizontal on desktop, vertical timeline on mobile (chosen).

Source events (ops view) are also chained with arrows and time deltas, at the user's request.

## Decision

Use the arrow-linked node journey. The user's words: "let's take that alternative, you can delete the previous one" (translated).

Reason for the source-event chain: not stated by the user.

## Consequences

- The list-style journey is removed from the mockups.
- Each node must still carry its provenance label where the date is not plain carrier data (see [0028](0028-provenance-labels-only-for-derived-dates.md)).
