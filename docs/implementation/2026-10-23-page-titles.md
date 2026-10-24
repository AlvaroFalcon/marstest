# Implementation: Page titles

- **Date:** 2026-10-24
- **Slug:** `page-titles`
- **Plan:** [`../plans/2026-10-23-page-titles.md`](../plans/2026-10-23-page-titles.md)
- **Branch / PR:** `claude/elegant-davinci-whot0c` / #
- **Status:** Done

## Progress

| Step | Status | Notes |
| --- | --- | --- |
| 1. Static title | Done | `index.html` title is "Shipment visibility". |
| 2. Message | Done | `documentTitle.page` in `src/locales/en.ts`. |
| 3. `DocumentTitle` component | Done | `src/components/layout/DocumentTitle.tsx`, by `react-vite-expert`. |
| 4. Titles per page | Done | All six pages. `CustomerShipmentPage`'s `DetailLayout` takes a new `shipmentId` prop so every state it wraps renders the title; `OpsExceptionsPage` builds the title once and places it in each of its three `<main>` branches. |
| 5. Implementation log | Done | |

## Deviations from the plan

| Step | Planned | Done instead | Reason |
| --- | --- | --- | --- |
| — | Milestone branch `feat/<short-description>` (`CLAUDE.md` §10) | Work stays on `claude/elegant-davinci-whot0c` | The session is bound to that branch by its environment; the research and plan commits already live there. |

## Verification

- [x] `npm run build` passes (existing chunk-size warning only)
- [x] `npm run lint` passes
- [x] `npm run test` passes (75 files, 1022 tests)
- [x] `npm run test:e2e` passes (287 passed, 9 skipped). Run locally with a temporary config pointing at the container's preinstalled Chromium, because the pinned Playwright browser build is not installed in the session; CI uses its own install.
- [x] Every acceptance criterion of the plan is met, checked with a Playwright script against `vite preview` at 1280 px and 375 px:
  - [x] Page source title is "Shipment visibility".
  - [x] "Exceptions inbox", "All shipments" and "Your shipments" titles on their lists.
  - [x] "SH-1042 · Shipment visibility" on the ops exception, ops shipment and customer shipment details; clicking SH-1042 from the list and going back restores "All shipments · Shipment visibility".
  - [x] "Page not found · Shipment visibility" for `/nope`, an unknown customer and another customer's shipment (`/customers/nordwerk/shipments/SH-1037`).
  - [x] `<head>` holds exactly two `<title>` elements on every route: the static one and a single React one.

## Follow-ups

None opened. Items left out on purpose are listed in the plan's "Out of scope" and [ADR 0073](../decisions/0073-page-titles-only-no-seo.md).
