# 0023. Customer shipment list is a table on desktop and cards on mobile

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The customer list was first designed as cards. The user asked for a table because a subsidiary has many active orders. The user then asked for mobile versions of all views.

## Options considered

1. **Table on desktop and mobile.** Not chosen for mobile, since a table does not fit a 390 px screen.
2. **Cards on desktop and mobile.** Replaced by the table on desktop.
3. **Table on desktop, cards on mobile.** Chosen.

## Decision

The customer list is a table on desktop and a card list on mobile. The user's words: "table on desktop for the customer list, cards on mobile" (translated).

Reason stated: a subsidiary has many active orders (paraphrased by the user's request for a table).

## Consequences

- Table and cards share one data source; the table is the component used for the customer and operations lists.
- The desktop card list for customers is deleted from the mockups.
