# Implementation: Scripted carrier events per viewer

- **Date:** 2026-10-23
- **Slug:** `scripted-carrier-events`
- **Plan:** [`../plans/2026-10-23-scripted-carrier-events.md`](../plans/2026-10-23-scripted-carrier-events.md)
- **Branch / PR:** `feat/scripted-carrier-events` / #31
- **Status:** Done

## Progress

| Step | Status | Notes |
| --- | --- | --- |
| 1. Event model and catalogue | Done | `createScriptedEvents`, `OPS_EVENT_SCRIPT`, `CUSTOMER_EVENT_SCRIPTS`, `getEventScript` in `src/api/seed.ts`; `appliedEventIds` and `Viewer` in `src/api/types.ts` |
| 2. Apply the next event | Done | `simulateCarrierEvent(viewer)` in `src/api/shipmentsApi.ts`, ids at the next free positions; storage key `v3` |
| 3. Toast and navigation | Done | Headline toast with "View" per viewer, finished-script toast; exception page redirect |
| 4. Tests | Done | Unit, hook, router and E2E (`simulate-event.spec.ts`, `demo-story.spec.ts`) |

## Decisions taken at the gate (user, 2026-10-23)

| Choice | Chosen |
| --- | --- |
| Ops on an exception that an event closes | Redirect to the ops shipment detail; ops "View" on closing events goes there too |
| SH-1035 event | A second driver takes over at Mâcon (`driver-swap-sh-1035`), since the 11 h rest cannot be over yet |
| Time model | Events happen at the frozen demo time; legs and texts adjusted where cheap (SH-1066 pickup at demo time, SH-1033 delivered 18 h ahead of plan) |
| Extra output when an exception closes | None: the exception is removed, the AI signal cleared where present, no good-news draft |

## Deviations from the plan

| Step | Planned | Done instead | Reason |
| --- | --- | --- | --- |
| 1 | Event `rest-over-sh-1035` | `driver-swap-sh-1035` | Gate decision above; plan row updated |
| 3 | No change outside the API and hook | `ExceptionDetailPanel` redirects in-scope shipments without an open exception | Gate decision above |
| 4 | `e2e/simulate-event.spec.ts` only | Also `e2e/demo-story.spec.ts` | Its Nordwerk click now applies SH-1053 instead of SH-1060 |

## Verification

- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes (949 tests)
- [x] `npm run test:e2e` passes (257 passed, 9 skipped as before)
- [x] Every acceptance criterion of the plan is met (each mapped to unit and E2E tests)

## Follow-ups

- None. A closing event can never meet an unseen marker with this catalogue (one event per
  shipment), so that path is not tested.
