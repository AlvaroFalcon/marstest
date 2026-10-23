# Plan: Notification center

- **Date:** 2026-10-23
- **Slug:** `notification-center`
- **Research:** [`../research/2026-10-23-notification-center.md`](../research/2026-10-23-notification-center.md)
- **Status:** Approved

## Summary

A bell in the header shows how many carrier events the current viewer has not read. It opens a
panel with the viewer's recent events, newest first; clicking one marks it as read and opens the
shipment, like the toast's "View". Ops see every event, a customer only events on their shipments.

## Decisions

| Decision | Options considered | Chosen | Decided by | ADR |
| --- | --- | --- | --- | --- |
| Where missed events live | Bell + panel / in-page feed / row markers / longer toasts | Bell with a notification panel | User | — |
| Initial content | Empty / a few seeded notifications | Empty, with an empty state | User | — |
| Mark as read | When the panel opens / per notification on click | Per notification on click | User | — |
| Read state | Shared / per viewer | Per viewer (ops and each customer) | User | — |
| Toast "View" | Marks the notification read / does not | Marks it read | User | — |
| Time label | None / fixed time / relative | Relative to now ("Just now" under the frozen demo clock) | User | — |
| Panel presentation | Popover only / popover + sheet | Popover on wide screens, sheet on narrow ones | Claude (ADR 0069 pattern) | — |

## Steps

1. **Data and API** — `src/api/types.ts`, `src/api/shipmentsApi.ts`, `src/api/mockDb.ts`
   - `notificationSchema`: `id`, `eventId`, `shipmentId`, `customerId`, `headline`, `receivedAt`,
     `opensException`, `readBy` (viewer keys such as `ops`, `customer:nordwerk`).
   - `demoStateSchema.notifications` (default `[]`); `simulateCarrierEvent` adds one per applied
     event. Storage key `v4`.
   - `listNotifications(viewer)` (newest first, customer-scoped) and
     `markNotificationRead(viewer, notificationId)` (idempotent).
2. **Hooks** — `src/hooks/useNotifications.ts`, `src/hooks/useMarkNotificationRead.ts`
   - Query key `['notifications', viewerKey]`; simulate and reset invalidate it.
   - The notification target (customer shipment, ops exception, ops shipment) is computed by one
     pure function in `src/lib/` shared with the toast "View".
3. **UI** — `src/components/notifications/NotificationBell.tsx`, `NotificationList.tsx`,
   `src/components/layout/AppHeader.tsx`, `src/locales/en.ts`
   - Bell button left of the viewer switch with an unread count badge; accessible name
     "Notifications, N unread".
   - Panel: list of headlines, unread ones with a dot and bold text (plus a visually hidden
     "Unread"); click marks read, navigates and closes the panel.
   - Empty state: "No notifications yet" and "Carrier events you simulate show up here."
4. **Tests** — unit (API), hook, component (bell, list, empty state), E2E (miss a toast, find it
   in the bell, open the shipment; per-viewer scoping; reset empties it).

## Acceptance criteria

- [ ] The header shows a bell with the number of unread notifications of the current viewer
- [ ] Before any simulated event the panel shows an empty state
- [ ] Every simulated event adds a notification with its headline, newest first
- [ ] A customer only sees notifications about their own shipments; ops see all of them
- [ ] Clicking a notification marks it as read for that viewer only and opens the same place as
      the toast "View"
- [ ] Read and unread notifications are distinguishable without relying on colour
- [ ] On narrow screens the panel opens as a sheet, on wide screens as a popover
- [ ] "Reset demo" empties the notifications

## Test strategy

| Level | What is covered | Files |
| --- | --- | --- |
| Unit (Vitest) | Notification created per event, scoping, ordering, read per viewer, reset | `src/api/shipmentsApi.test.ts`, `src/lib/*.test.ts` |
| Component (RTL) | Bell count and name, empty state, unread marker, click marks read and navigates | `src/components/notifications/*.test.tsx` |
| E2E (Playwright) | Missed toast found in the bell (desktop popover, mobile sheet), per-viewer scoping, reset | `e2e/notifications.spec.ts` |

## Out of scope

- Browser or push notifications, sound, email.
- "Mark all as read", deleting or filtering notifications.
- Notifications for things other than simulated carrier events.

## Milestone 2: severity badges and row separation (same PR, approved 2026-10-23)

Every notification row gets a badge that tells how serious the event was, reusing the inbox's
tones, icons and labels, and rows are visually separated so each notification reads on its own.

### Decisions

| Decision | Options considered | Chosen | Decided by | ADR |
| --- | --- | --- | --- | --- |
| Presentation | Badge per row / left stripe + badge / icon only | Badge under the headline, next to the time | User | — |
| Customer vocabulary | Ops badges / customer labels | Customer labels (the customer list's words), never ops vocabulary | User | — |
| Updates without an exception | No badge / grey "Update" | Grey "Update", so every row has a badge | User | — |
| Order | By date / by severity | By date, newest first (unchanged) | User | — |
| Where severity comes from | Recomputed / stored | Stored on the notification when it is created, so it does not change later | Claude | — |

### Severity per event (proposal)

| Event effect | Ops badge | Customer badge |
| --- | --- | --- |
| Opens an exception | The inbox badge of that exception type (`ExceptionStatusBadge`: tone, icon, label) | "At risk" (customer list presentation) |
| Closes an exception | "Resolved", success tone, check icon | "Back on track", success tone, check icon |
| Delivers the shipment | "Delivered" (customer list presentation) | "Delivered" |
| Anything else | "Update", neutral grey | "Update", neutral grey |

### Steps

1. **Data** — `src/api/types.ts`, `src/api/shipmentsApi.ts`: the notification stores its effect
   (`opened` with the exception type, `closed`, `delivered`, `update`) when the event is applied;
   storage key `v5`.
2. **Presentation** — `src/lib/notifications.ts` (pure mapping effect + viewer role → badge
   kind), `src/components/notifications/NotificationSeverityBadge.tsx`, `NotificationList.tsx`
   (badge next to the time label, a divider between rows), `src/locales/en.ts`.
3. **Tests** — mapping per effect and role, badge per row for ops and customer, customers never see
   ops labels, E2E for the badge of an opening and a closing event.

### Acceptance criteria

- [ ] Every notification row shows a severity badge with an icon and a label, never colour alone
- [ ] Ops see the inbox badge of the exception an event opened, "Resolved" for an event that closed
      one, "Delivered" for a delivery and "Update" otherwise
- [ ] Customers see "At risk", "Back on track", "Delivered" or "Update", never ops labels such as
      "Delay predicted"
- [ ] The badge of a notification does not change when its exception is closed later
- [ ] Rows are separated by a divider, so each notification is clearly distinct
- [ ] Notifications stay ordered by date, newest first
