# Implementation: Shipment visibility prototype

- **Date:** 2026-10-20
- **Slug:** `shipment-visibility-prototype`
- **Plan:** [`../plans/2026-10-20-shipment-visibility-prototype.md`](../plans/2026-10-20-shipment-visibility-prototype.md)
- **Branch / PR:** one branch and PR per milestone (ADR 0035), listed in the Progress table
- **Status:** In progress

## Progress

| Step | Status | Notes |
| --- | --- | --- |
| M1 · Design tokens and primitives | Done | `feat-design-tokens`. `src/index.css`: off-white page `--background` (cards stay white), `success` / `warning` / `info` with `-foreground` and `-subtle` in oklch for `:root` and `.dark`, all exposed in `@theme inline`. Info is the accent blue for AI content and estimates; danger keeps the existing `destructive` token. Added with `npx shadcn@latest add`: `badge`, `card`, `sheet`, `select`, `tabs`, `table`, `textarea`, `sonner`, `popover`, `tooltip`, `skeleton`, `separator` (existing `button` kept, not overwritten). `transition-all` → `transition-colors` in `badge` and `tabs`; sheet backdrop `bg-black/10` → new `overlay` token; unknown `toaster` class removed from `sonner`. After the `code-reviewer` pass: slide and zoom enter/exit animations in `popover`, `select`, `sheet` and `tooltip` gated with `motion-safe:` (fades kept), and `outline-none` → `outline-hidden` in `select`, `textarea` and `tabs` (CLAUDE.md §7). |
| M2 · Domain model, seed and fake API | Done | `feat-mock-data`. `src/api/types.ts`: zod schemas + inferred types for Site, Carrier, Customer, Destination, Leg (road / sea with vessel and voyage), Milestone (normalised status, `occurredAt`, `receivedAt`, `source` carrier with `rawEventIds` / derived), RawCarrierEvent (channel api / edi / email / portal, raw text, mapping rule / ai + confidence), CarrierEta (`provided` with source and `updatedAt` / `notProvided`), EstimatedEta (date, range, confidence, reason), ShipmentDocument (received with extracted fields / pending), ErpOrder, ShipmentException (type, `openedAt`, `aiDiagnosis`, `draft`), DemoState. `src/api/seed.ts`: 18 shipments, 3 customers, 3 in-scope sites + Lyon warehouse, 5 carriers, all dates relative to an injectable `demoNow` (default `DEMO_NOW` = 2026-10-20T10:00Z). Scenarios: SH-1042 customs hold (missing certificate of origin, HS code 8467.29 vs 8467.21, demurrage), SH-1060 rolled vessel, SH-1037 predicted delay, SH-1029 stale 48 h (AI mapping 54 %), SH-1051 incident, SH-1033 on track, SH-1034 suspected 58 %, SH-1035 predicted 92 %, SH-1044 no carrier ETA, SH-1009 delivered 1 day early with POD; SH-1042 email mapped by AI at 91 %; SH-1058 (Lyon) has an open exception to exercise ops scoping. `src/api/mockDb.ts`: in-memory store, persisted to `sessionStorage` under `marstest:demo-state:v1`, stored state validated with zod, memory-only fallback when storage throws, `reset()`. `src/api/shipmentsApi.ts`: `createShipmentsApi({ db, latencyMs = 200, now })` + app instance `shipmentsApi`; all functions return deep copies after the latency. Unit tests: `seed.test.ts`, `mockDb.test.ts`, `shipmentsApi.test.ts`. |
| M3 – M17 | Pending | |

## Deviations from the plan

Every change of direction, with its reason. Deviations decided or approved by the user also get an ADR.

| Step | Planned | Done instead | Reason |
| --- | --- | --- | --- |
| M1 | Only `success`, `warning`, `info` (+ `-subtle`) tokens | Also `-foreground` for each role and an `overlay` token | `-foreground` follows the shadcn token pattern for text on solid fills; `overlay` replaces the raw `bg-black/10` of the sheet backdrop so every primitive colour maps to a token. `overlay` is 10 % black in light (upstream value) but 50 % in dark, because 10 % black barely dims an already dark page. |
| M1 | No new dependencies beyond the agreed stack | `next-themes` and `sonner` installed by the shadcn `sonner` primitive; `next-themes` kept | User decision, [ADR 0037](../decisions/0037-keep-next-themes-for-sonner-theme.md). Added to `CLAUDE.md` §2. |
| M2 | API functions `listExceptions`, `listShipments`, `getShipment`, `approveDraft`, `discardDraft`, `simulateCarrierEvent`, `resetDemo` | Also `getReferenceData()` (customers, sites, carriers) | Screens need names for customer, site and carrier ids; serving them through the API keeps `src/api` the only data source, so a real backend later only replaces `src/api`. |
| M2 | ShipmentException with `draft` and `notifiedAt` | `draft` is a discriminated union: `none` / `pending` (body) / `sent` (body, `notifiedAt`) / `discarded` (`discardedAt`) | Rules in `.claude/rules/lib-and-hooks.md`: no `null` / `undefined` through call chains. Each draft state carries only the fields that exist in it. |
| M2 | Shipment model (status implied) | No stored shipment status, freshness or delay class; `exceptions` holds open exceptions only (empty when none) | Status, freshness and the 75 % classification are derived in M3 from milestones, raw events and ETAs, so they cannot drift when a carrier event is simulated. |
| M2 | "Simulate carrier event" target not named in the plan | Scripted event rolls the vessel of SH-1047 (Alpen Werkzeug, Mareline Barcelona → Genoa), opens a `vesselRolled` exception with a pending draft, applied once | SH-1060 already starts rolled, so the demo needs another on-track sea shipment to show a new exception appearing. Easy to change in `createSimulatedCarrierEvent`; to be confirmed by the user. |
| M2 | API returns data for the viewer | API returns unscoped data; ops / customer scoping stays in M3 `scope` | Plan puts scoping in `src/lib/scope` (pure, unit-tested). |
| M2 | Seed content matches the mockups | Seed written from the research doc and the task brief | The Pencil mockups are still not saved to disk and the Pencil app was not reachable, so names of destinations, cargo and PO numbers are synthetic. |

## Verification

M2:

- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes (35 tests; 31 new in `src/api/`)
- [x] Every M2 acceptance criterion of the plan is met

M1:

- [x] `npm run build` passes
- [x] `npm run lint` passes (ESLint incl. Stylistic and better-tailwindcss, Stylelint)
- [x] `npm run test` passes
- [x] Every M1 acceptance criterion of the plan is met

## Follow-ups

Issues to open for work left out.

None so far.
