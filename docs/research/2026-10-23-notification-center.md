# Research: Notification center

- **Date:** 2026-10-23
- **Slug:** `notification-center`
- **Status:** Reviewed

## Goal

Every simulated carrier event shows a toast that disappears after a few seconds. An agent who is
busy or away misses it, and nothing else records it: only events that open an exception leave a
"New" marker on the ops inbox card. Ops and customers need a place to see recent events and open
the affected shipment later.

## Current state

| Area | Files | Notes |
| --- | --- | --- |
| Events | `src/api/seed.ts` (`createScriptedEvents`, scripts) | Each event has `id`, `shipmentId` and a hand-written `headline` (PR #31). |
| Apply | `src/api/shipmentsApi.ts` (`simulateCarrierEvent(viewer)`) | Pushes the event id to `appliedEventIds` (ordered) and the shipment to `unseenExceptionShipmentIds` when an exception opens. |
| State | `src/api/types.ts` (`demoStateSchema`), `src/api/mockDb.ts` | `sessionStorage` key `v3`; reset reseeds. |
| Toast | `src/hooks/useSimulateCarrierEvent.ts` | Headline + "View" (customer shipment / ops exception / ops shipment). |
| Viewer | `src/hooks/useViewer.ts`, `Viewer` type in `src/api/types.ts` | Ops or one customer, from the URL. |
| Header | `src/components/layout/AppHeader.tsx` | Brand bar with `ViewerSelect` on the right: the natural place for a bell. |
| Primitives | `src/components/ui/popover.tsx`, `sheet.tsx`, `badge.tsx`, `button.tsx` | Popover on wide screens and sheet on narrow ones already follows ADR 0069 (`useMediaQuery`). |

## Dependencies and constraints

- The demo clock is frozen (`DEMO_NOW_ISO`), so every event is received at the same time.
- Per-viewer data: a customer must only see notifications about their own shipments.
- State is shared and persisted like the rest of the demo; "Reset demo" empties it.
- Accessibility: the bell needs an accessible name with the unread count, and unread is not
  conveyed by colour alone.

## Gaps

- A notification record (event, shipment, customer, headline, time) and read state per viewer.
- API calls to list a viewer's notifications and mark one as read.
- Bell with unread count, panel with the list, empty state, navigation on click.

## Risks and tricky parts

- All timestamps are equal under the frozen clock, so a time label adds nothing.
- The toast "View" and the notification lead to the same place; reading one should probably
  mark the other.
- The header is already tight on mobile (brand icon, viewer switch).

## Open questions

- [x] Seeded notifications or empty start? → empty, with an empty state (user).
- [x] Mark as read on open or on click? → on click (user).
- [x] Read state per viewer? → yes (user).
- [x] Does the toast "View" mark the notification as read? → yes (user).
- [x] What shows the time of each notification? → a relative label, "Just now" under the frozen clock (user).

## References

- PR #31 (scripted carrier events), ADR 0069 (popover vs sheet by viewport).
