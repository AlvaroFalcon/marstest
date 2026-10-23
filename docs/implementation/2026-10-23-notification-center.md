# Implementation: Notification center

- **Date:** 2026-10-23
- **Slug:** `notification-center`
- **Plan:** [`../plans/2026-10-23-notification-center.md`](../plans/2026-10-23-notification-center.md)
- **Branch / PR:** `feat/notification-center` / #32
- **Status:** Done

## Progress

| Step | Status | Notes |
| --- | --- | --- |
| 1. Data and API | Done | `CarrierNotification` in `src/api/types.ts`; one notification per applied event; `listNotifications`, `markNotificationRead`; storage key `v4` |
| 2. Hooks | Done | `useNotifications`, `useMarkNotificationRead`; pure helpers in `src/lib/notifications.ts`, `getNotificationPath` shared with the toast "View" |
| 3. UI | Done | `NotificationBell`, `NotificationList`, `NotificationsEmpty`, `NotificationCenter`; header slot left of the viewer switch |
| 4. Tests | Done | Unit, component, hook and `e2e/notifications.spec.ts` (desktop and mobile) |
| Review of PR #32 | Done | Toast "View" through `useMarkNotificationRead`, `@/` imports, skeleton `role="status"`, named props type, JSDoc, split E2E test, follow-up #33 |
| M2.1 Data | Done | `effect` stored on each notification; `getNotificationSeverity`; storage key `v5` |
| M2.2 Presentation | Done | `NotificationSeverityBadge` (reuses the inbox and customer list badges), divider between rows |
| M2.3 Tests | Done | Mapping per effect and role, badge per kind, ops vs customer labels, E2E per viewer |

## Decisions taken at the gate (user, 2026-10-23)

| Choice | Chosen |
| --- | --- |
| Who gets an unread notification | Every entitled viewer, including the one who triggered the event |
| Count badge | Info pill with the exact number, hidden at 0; accessible name "Notifications" at 0 |
| Type name | `CarrierNotification`, since `Notification` shadows the DOM global |
| Toast covering the mobile sheet | Left as is: the toast goes away by itself, like over the site filter sheet |
| M2: stale-tracking exception (no hours known) | "No update" without hours, inbox neutral tone and clock icon |

Claude defaults (reviewed with the user as part of the gate): popover `w-96` / `max-h-96` and sheet
capped at 80 svh, `Bell` / `BellOff` icons, skeleton while loading and an error with "Try again",
no extra live region (the toast already announces the event), ordering by insertion because the
frozen clock makes every `receivedAt` equal.

## Deviations from the plan

| Step | Planned | Done instead | Reason |
| --- | --- | --- | --- |
| 1 | `notificationSchema` / `Notification` | `carrierNotificationSchema` / `CarrierNotification` | Gate decision above |
| 3 | Unread marker "Unread" | Visually hidden "Unread:" followed by a space | Screen readers read "UnreadSH-1060…" without the separator |

## Verification

- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes (1022 tests)
- [x] `npm run test:e2e` passes (287 passed, 9 skipped as before)
- [x] Every acceptance criterion of the plan is met, milestone 2 included (each mapped to unit,
      component and E2E tests; the row divider is CSS only and checked visually)

## Follow-ups

- [#33](https://github.com/AlvaroFalcon/marstest/issues/33): scope ops notifications to the ops
  sites. Ops see every notification while their lists are scoped to their sites; no scripted
  event targets an out-of-scope shipment, so it cannot show today.
