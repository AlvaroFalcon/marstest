# Plan: Page titles

- **Date:** 2026-10-23
- **Slug:** `page-titles`
- **Research:** [`../research/2026-10-23-page-titles.md`](../research/2026-10-23-page-titles.md)
- **Status:** Approved

## Summary

Every page sets a meaningful document title, so tabs, history and bookmarks tell pages apart and screen readers announce where the user landed. The static title in `index.html` becomes the site name, and each page renders its own `<title>` through React 19's built-in hoisting. Nothing else from the original SEO research is done.

## Decisions

| Decision | Options considered | Chosen | Decided by | ADR |
| --- | --- | --- | --- | --- |
| Scope | Full SEO pass, metadata + titles, titles only | Titles only, no new tests | User, on Claude's proposal | [0073](../decisions/0073-page-titles-only-no-seo.md) |
| Site name | "Shipment visibility" (existing `shell.brand`) or a new name | "Shipment visibility" | User | — |
| Title format | — | `<Page> · Shipment visibility`; detail pages use the shipment id: `SH-1042 · Shipment visibility` | User, on Claude's proposal | — |
| Title mechanism | react-helmet-async, `useEffect` + `document.title`, React 19 `<title>` | React 19 `<title>`: no dependency. React inserts it before the static `<title>` of `index.html` (`mountHoistable` in react-dom), so it wins, and the static one remains for the moment before JavaScript runs | Claude | — |
| Source of the detail id | The URL param or the loaded shipment | The URL param: the title is right at once, without waiting for data | Claude | — |

## Steps

1. **Static title** — `index.html`
   - `<title>marstest</title>` → `<title>Shipment visibility</title>`.
2. **Message** — `src/locales/en.ts`
   - `documentTitle.page`: `'{page} · Shipment visibility'`. Page names reuse the existing messages `opsExceptions.title`, `opsShipments.title`, `customerShipments.title` and `notFound.title`.
3. **`DocumentTitle` component** — `src/components/layout/DocumentTitle.tsx`
   - `export type DocumentTitleProps = { page: string }`; renders `<title>` with `documentTitle.page` formatted as a single string child (React requires one string).
   - JSDoc explains the hoisting, the static fallback in `index.html`, and that each rendered state must render exactly one.
4. **Titles per page** — one `DocumentTitle` per rendered state, never two at once:
   - `src/pages/ops/OpsExceptionsPage.tsx`: the shipment id when `shipmentId` is set, otherwise `opsExceptions.title`.
   - `src/pages/ops/OpsShipmentsPage.tsx`: `opsShipments.title`.
   - `src/pages/ops/OpsShipmentPage.tsx`: the shipment id from the URL.
   - `src/pages/customers/CustomerShipmentsPage.tsx`: inside `PageMain`, `customerShipments.title`.
   - `src/pages/customers/CustomerShipmentPage.tsx`: inside `DetailLayout` (the `notFound` branch renders `NotFoundPage`, which brings its own title).
   - `src/pages/NotFoundPage.tsx`: `notFound.title` (covers the catch-all route and the unknown customer / shipment branches of `CustomerGate` and `CustomerShipmentPage`).
5. **Implementation log** — `docs/implementation/2026-10-23-page-titles.md`.

## Acceptance criteria

- [ ] Before JavaScript runs (page source), the title is "Shipment visibility".
- [ ] The tab reads "Exceptions inbox · Shipment visibility" on `/ops/exceptions`, "All shipments · Shipment visibility" on `/ops/shipments` and "Your shipments · Shipment visibility" on a customer list.
- [ ] Opening SH-1042 as an ops exception, an ops shipment or a customer shipment changes the tab to "SH-1042 · Shipment visibility"; going back restores the list title.
- [ ] An unknown path, an unknown customer and another customer's shipment read "Page not found · Shipment visibility".
- [ ] `<head>` never holds more than one `<title>` rendered by React.
- [ ] `npm run build`, `npm run lint`, `npm run test` and `npm run test:e2e` pass.

## Test strategy

No new tests, by the user's decision ([0073](../decisions/0073-page-titles-only-no-seo.md)). Existing suites must pass unchanged; acceptance criteria are checked by hand in the built app (`npm run preview`) and by the QA review on the PR.

| Level | What is covered | Files |
| --- | --- | --- |
| Unit (Vitest) | Existing suites only | — |
| Component (RTL) | Existing suites only | — |
| E2E (Playwright) | Existing suites only | — |

## Out of scope

Decided by the user ([0073](../decisions/0073-page-titles-only-no-seo.md)): the pages live behind a login in the real product, so search and link-preview optimisation brings nothing.

- Indexing policy, `robots.txt`, `sitemap.xml`, canonical links.
- Meta description, Open Graph / Twitter tags, `theme-color`, preview image, icons.
- Screen-reader `h1` on the exceptions inbox.
- Code splitting and font subsets.
- HTTP 404 statuses, prerendering / SSR (ADR 0001: Vite SPA only).
- New automated tests.
