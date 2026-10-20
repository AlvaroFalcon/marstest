# Plan: Shipment visibility prototype

- **Date:** 2026-10-20
- **Slug:** `shipment-visibility-prototype`
- **Research:** [`../research/2026-10-20-shipment-visibility-prototype.md`](../research/2026-10-20-shipment-visibility-prototype.md)
- **Status:** Approved

## Summary

Build the frontend-only shipment visibility prototype agreed in research: an operations view (exceptions inbox, exception detail, all shipments, shipment detail states, source events panel, site filter) and a customer self-service view (shipments list, shipment detail), desktop and mobile, with simulated AI and synthetic data, deployed on Vercel. Delivery is split into 17 small feature milestones, one branch and one pull request each, each with its own acceptance criteria.

## Decisions

| Decision | Options considered | Chosen | Decided by | ADR |
| --- | --- | --- | --- | --- |
| Runtime data source | In-memory fake API; msw service worker in the browser | In-memory fake API in `src/api/` (async functions, ~200 ms latency) consumed via TanStack Query; msw only in tests | User, on Claude's proposal | [0033](../decisions/0033-in-memory-fake-api-for-runtime-data.md) |
| Demo state on reload | Reset on reload; keep in `sessionStorage` | `sessionStorage` + "Reset demo" action | User | [0034](../decisions/0034-demo-state-kept-in-session-storage.md) |
| Delivery | ~6 chunks; one branch with one PR; small feature milestones | Small feature milestones, one branch + PR each, each with its own acceptance criteria | User | [0035](../decisions/0035-small-feature-milestones-one-pr-each.md) |
| 4-page write-up | Separate cycle; last chunk of this plan | Separate RPI cycle after the prototype | User, on Claude's proposal | [0036](../decisions/0036-write-up-as-separate-cycle.md) |
| Routing | — | Role and identity in the path; view state (`site`, `status`, `q`, `page`, `sort`, `events=open`) in zod-validated search params | Claude | — |
| Responsive strategy | — | Same routes; container queries switch table→cards, horizontal→vertical journey, popover→bottom sheet | Claude | — |
| Dark mode | — | Follows the system; toggle in the demo strip stored in `localStorage` | Claude | — |

### Architecture (shared by all milestones)

- **Routes** (`src/routes.ts`): `/` → `/ops/exceptions`; `/ops/exceptions[/:shipmentId]`; `/ops/shipments[/:shipmentId]`; `/customers/:customerId/shipments[/:shipmentId]`.
- **Data** (`src/api/`): `types.ts` (zod schemas: Site, Carrier, Customer, Shipment, Leg, Milestone, RawCarrierEvent, CarrierEta, EstimatedEta, ShipmentDocument, ShipmentException), `seed.ts` (18 shipments, 3 customers, 3 sites + 1 out of scope, 5 carriers, injectable `demoNow`), `mockDb.ts` (in-memory + `sessionStorage`, `reset()`), `shipmentsApi.ts`.
- **Pure logic** (`src/lib/`, unit-tested): `normalizeStatus`, `eta`, `freshness`, `delayClassification` (75 %), `exceptionPriority`, `scope`, `documentCheck`, `aiText` (templates over shipment data only).
- **Hooks** (`src/hooks/`): `useViewer`, `useExceptions`, `useShipments`, `useShipment`, mutations, one `use<Route>SearchParams` per route.
- **Components** (`src/components/<feature>/`) on shadcn/ui primitives.
- **Agents**: `react-vite-expert` (logic, hooks, pages), `ui-ux-expert` (components), `test-expert` (tests), `code-reviewer` before each PR, PRs via `create-pull-request`, `qa-reviewer` on each PR.

## Steps

Each step is one milestone: one branch `feat-<name>`, one PR. Order follows dependencies.

1. **M1 · Design tokens and primitives** — `feat-design-tokens` — `src/index.css`, `src/components/ui/*`
   - Semantic `success`, `warning`, `info` tokens and `-subtle` backgrounds in oklch for `:root` / `.dark`, off-white page background; shadcn `badge`, `card`, `sheet`, `select`, `tabs`, `table`, `textarea`, `sonner`, `popover`, `tooltip`, `skeleton`, `separator`.
2. **M2 · Domain model, seed and fake API** — `feat-mock-data` — `src/api/types.ts`, `seed.ts`, `mockDb.ts`, `shipmentsApi.ts`
3. **M3 · Business logic and simulated AI** — `feat-domain-logic` — `src/lib/*.ts`
4. **M4 · App shell and role switch** — `feat-app-shell` — `src/routes.ts`, `src/Router.tsx`, page stubs, `src/components/layout/AppHeader.tsx`, `OpsTabs.tsx`, `src/hooks/useViewer.ts`, `src/locales/en.ts`, `e2e/home.spec.ts` (replaces the scaffold `HomePage`)
5. **M5 · Provenance components** — `feat-provenance-components` — `src/components/provenance/ProvenanceBadge.tsx`, `EtaPair.tsx`, `FreshnessIndicator.tsx`, `AiBlock.tsx`
6. **M6 · Journey component** — `feat-journey` — `src/components/journey/Journey.tsx`
7. **M7 · Exceptions inbox** — `feat-exceptions-inbox` — `src/pages/ops/OpsExceptionsPage.tsx`, `src/components/exceptions/ExceptionInbox.tsx`, `ExceptionCard.tsx`, `src/components/shipments/SiteFilter.tsx`, `src/hooks/useExceptions.ts`
8. **M8 · Exception detail** — `feat-exception-detail` — `src/components/shipments/ShipmentDetail.tsx` (exception layer), `src/components/exceptions/DocumentCheck.tsx`, `src/hooks/useShipment.ts`
9. **M9 · Recommended action and approval** — `feat-recommended-action` — `src/components/exceptions/RecommendedAction.tsx`, `src/hooks/useApproveDraft.ts`, `useDiscardDraft.ts`
10. **M10 · Source events sheet** — `feat-source-events` — `src/components/shipments/SourceEventsSheet.tsx`
11. **M11 · All shipments** — `feat-ops-shipments-list` — `src/pages/ops/OpsShipmentsPage.tsx`, `src/components/shipments/ShipmentsTable.tsx`, `ShipmentCard.tsx`, `src/hooks/useShipments.ts`
12. **M12 · Ops shipment detail states** — `feat-ops-shipment-detail` — `src/pages/ops/OpsShipmentPage.tsx`, `ShipmentDetail.tsx`
13. **M13 · Customer shipments list** — `feat-customer-shipments` — `src/pages/customers/CustomerShipmentsPage.tsx`, `src/components/customer/ProactiveAlert.tsx`
14. **M14 · Customer shipment detail** — `feat-customer-shipment-detail` — `src/pages/customers/CustomerShipmentPage.tsx`, `src/components/customer/CustomerDocuments.tsx`
15. **M15 · Simulate carrier event** — `feat-simulate-event` — `src/hooks/useSimulateCarrierEvent.ts`, `AppHeader.tsx`, `ExceptionCard.tsx`
16. **M16 · Demo story and accessibility pass** — `feat-demo-story` — `e2e/*.spec.ts`, fixes found
17. **M17 · Vercel deployment** — `feat-vercel-deploy` — Vercel SPA config (via `devops-expert`), `README.md`

## Acceptance criteria

Every PR also requires: `build`, `lint` and `test` green; `test:e2e` when routes change; no horizontal scroll at 375 px; light and dark theme; keyboard accessible; status never conveyed by colour alone; text ≥ 12 px.

### M1 · Design tokens and primitives
- [ ] New tokens exist for light and dark and are exposed in `@theme inline`.
- [ ] Primitives are added with the shadcn CLI, colours mapped to tokens, no `transition-all`.
- [ ] Lint (incl. Stylelint and Tailwind rules) passes.

### M2 · Domain model, seed and fake API
- [ ] The seed has 18 shipments, 3 customers, 3 in-scope sites + 1 out of scope, 5 carriers, and covers: customs hold, rolled vessel, predicted delay, stale 48 h, incident, on track, suspected 58 %, predicted 92 %, no carrier ETA, delivered.
- [ ] Every shipment passes the zod schemas.
- [ ] State persists in `sessionStorage`, falls back to memory when storage fails, and `reset()` restores the seed.
- [ ] API functions return copies and resolve after the simulated latency.

### M3 · Business logic and simulated AI
- [ ] Known carrier messages map by rule; unknown ones use the seeded AI mapping with confidence; < 70 % is flagged for review.
- [ ] ETA comparison returns in line / deviates / no carrier ETA.
- [ ] The 75 % threshold classifies on track / watching / predicted delay.
- [ ] Exceptions are ordered by urgency; scope filters by ops sites or customer id.
- [ ] Document check returns matches, mismatches and missing documents.
- [ ] AI text helpers only use values present in the shipment.

### M4 · App shell and role switch
- [ ] `/` redirects to `/ops/exceptions`.
- [ ] The demo strip shows "Demo mode", a working "Reset demo" and a persisted theme toggle.
- [ ] "Viewing as" switches between "Ops · Spain sites" and the 3 customers by changing the path.
- [ ] Ops pages show the "Exceptions · All shipments" tabs with the exception count.
- [ ] E2E covers navigation between roles and tabs on desktop and mobile.

### M5 · Provenance components
- [ ] `EtaPair` always shows the carrier ETA with source and freshness ("Not provided" when missing) and our estimate with date, confidence and "Why"; blue only when it deviates; both cards have equal height.
- [ ] `FreshnessIndicator` shows "Updated X ago" or "No update for X h".
- [ ] `AiBlock` has one blue style, an "AI …" label and a "Based on N events" action.

### M6 · Journey component
- [ ] Nodes are joined by arrows: horizontal in wide containers, vertical timeline in narrow ones.
- [ ] Past carrier milestones have no label; future dates show "Carrier ETA" or "Estimated · N %"; derived data shows "Derived from GPS".
- [ ] An optional `onStepSelect` makes steps keyboard-focusable buttons (used by ops).

### M7 · Exceptions inbox
- [ ] The inbox lists only exceptions from the ops user's sites, ordered by urgency; each card shows route, reason and status badge.
- [ ] KPIs (need attention, stale > 24 h, on time) are consistent with the seed.
- [ ] The site filter (popover on desktop, bottom sheet on mobile) filters via `?site=`; the out-of-scope site is shown locked.
- [ ] Selecting a card opens `/ops/exceptions/:id` and highlights the open card.
- [ ] E2E covers filtering by site and opening an exception.

### M8 · Exception detail
- [ ] The detail shows title, status, "Exception open" badge, internal data row (customer, site, carrier, PO), `EtaPair`, `Journey` and the AI diagnosis.
- [ ] The document check lists each document against the ERP order (missing certificate of origin and HS code mismatch on SH-1042).
- [ ] Desktop shows inbox and detail side by side; mobile shows the detail on its own route with a back link.

### M9 · Recommended action and approval
- [ ] The AI draft is editable and shows "Nothing is sent without your approval."
- [ ] "Approve and send" shows a toast, marks the card "Customer notified" and locks the draft; "Discard" removes the draft.
- [ ] "Upload certificate of origin" and "Request it from Chamber of Commerce" give simulated feedback (no dead buttons).

### M10 · Source events sheet
- [ ] The sheet opens from "Based on N events" and from journey steps, closes with Esc and returns focus.
- [ ] Each event shows carrier, channel, time, raw message, normalised status and "Mapped by rule" / "Mapped by AI · N %"; low confidence is flagged for review.
- [ ] Events are chained with arrows and time deltas.

### M11 · All shipments
- [ ] Table (desktop) / cards (mobile) list all in-scope shipments with shipment/customer, route/carriers, milestone, status, carrier ETA, our estimate, confidence and updated.
- [ ] Search, site and status filters, sort (carrier ETA, confidence) and pagination live in the URL; changing a filter resets to page 1.
- [ ] The footer shows "Showing N of M".
- [ ] A row opens the exception detail when it has an open exception, otherwise `/ops/shipments/:id`.

### M12 · Ops shipment detail states
- [ ] On track: estimate in line, "No open exception", manual actions only.
- [ ] Watching (< 75 %): AI signal, "Not alerting the customer yet", suggested "Ask carrier to confirm".
- [ ] Predicted delay (≥ 75 %): AI signal, exception opened, link to the inbox.
- [ ] The states come from seeded data, not separate screens.

### M13 · Customer shipments list
- [ ] A customer only sees their own shipments; another customer's shipment URL shows not found.
- [ ] A proactive alert appears for shipments at risk or with a notice sent.
- [ ] Status tabs (All · Needs attention · In transit · Delivered) and search work.

### M14 · Customer shipment detail
- [ ] The detail shows the AI summary, `EtaPair`, `Journey` (no ops actions, no legend) and read-only documents (download / pending).
- [ ] The delivered state shows delivery time vs plan ("1 day early") and the POD.
- [ ] No internal data (diagnosis, document check, drafts) is visible to customers.

### M15 · Simulate carrier event
- [ ] "Simulate carrier event" adds the scripted event (vessel rolled), updates freshness and the journey, and re-orders the inbox.
- [ ] Ops get a toast and a "New" marker on the affected card.
- [ ] The state survives a reload; "Reset demo" clears it.

### M16 · Demo story and accessibility pass
- [ ] E2E demo script: ops inbox → SH-1042 → approve → switch to Nordwerk → alert and revised ETA visible; simulate event.
- [ ] Keyboard-only walkthrough with visible focus, AA contrast, no text < 12 px, no horizontal scroll at 375 px.

### M17 · Vercel deployment
- [ ] Deep links (e.g. `/ops/exceptions/SH-1042`) load on refresh.
- [ ] `PLAYWRIGHT_BASE_URL=<vercel url> npm run test:e2e` passes.

## Test strategy

| Level | What is covered | Files |
| --- | --- | --- |
| Unit (Vitest) | M2 data layer (schemas, persistence, reset), M3 logic (normalisation, ETA, freshness, threshold, priority, scope, document check, AI text) | `src/api/*.test.ts`, `src/lib/*.test.ts` |
| Component (RTL) | M5 provenance states, M6 journey labels, M7 cards and site filter, M9 approve/discard, M11 table sort and pagination | `src/components/**/*.test.tsx` |
| E2E (Playwright) | M4 navigation, M7 inbox, M11 list, M13 customer scoping, M16 demo story, M17 deployed URL; desktop and mobile projects | `e2e/*.spec.ts` |

## Out of scope

Real backend or integrations, real authentication, maps, route optimisation, carrier scorecard screen, freight cost auditing, Incoterms, customer document upload and the geofence example (decided in research), infinite scroll, and the 4-page write-up (separate cycle).
