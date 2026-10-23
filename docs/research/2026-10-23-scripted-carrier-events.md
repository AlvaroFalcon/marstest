# Research: Scripted carrier events per viewer

- **Date:** 2026-10-23
- **Slug:** `scripted-carrier-events`
- **Status:** Reviewed

## Goal

"Simulate carrier event" applies one fixed event (vessel rolled on SH-1060, a Brenner Iberia
shipment) once, wherever it is clicked. A customer viewer such as Nordwerk gets a toast about a
shipment that is not theirs and has no way to open it. We want each click to apply the next event
of a script that belongs to the current viewer, so the demo shows several states and feels alive:
customers see events on their own shipments (with a "View" action) and ops walk through their own
sequence.

## Current state

| Area | Files | Notes |
| --- | --- | --- |
| Event data | `src/api/seed.ts` (`createSimulatedCarrierEvent`, `SIMULATED_*` constants, `simulationTargetLegs`) | One event: new legs, raw event, milestone, carrier ETA, estimated ETA, an exception with draft and the customer summary. Ids derive from `SIMULATED_EVENT_SEQUENCE` (next free milestone position on SH-1060). |
| Apply | `src/api/shipmentsApi.ts` (`simulateCarrierEvent`) | Idempotent by checking whether the raw event id exists on SH-1060. Pushes the shipment id to `unseenExceptionShipmentIds`. Returns `{ shipment, applied }`. |
| State | `src/api/types.ts` (`demoStateSchema`), `src/api/mockDb.ts` | Persisted in `sessionStorage` under `marstest:demo-state:v2`; nothing records which events ran. |
| Feedback | `src/hooks/useSimulateCarrierEvent.ts` | Ops toast with "View" to the exception; customers get the same text without action. Repeat click: "Already simulated. Reset the demo to run it again." |
| Viewer | `src/hooks/useViewer.ts` | `{ role: 'ops' }` or `{ role: 'customer', customerId }`, derived from the URL. |
| Trigger | `src/components/layout/AppLayout.tsx` | Same header button in both areas. |
| Derived state | `src/lib/` (status, delay classification, freshness, inbox) | Everything is derived from milestones, raw events, ETAs and `exceptions`, so new events only need to change data. `exceptions` holds open exceptions only: removing one closes it. |
| Tests | `src/api/seed.test.ts`, `src/api/shipmentsApi.test.ts`, `src/api/mockDb.test.ts`, `src/hooks/useSimulateCarrierEvent.test.tsx`, `src/Router.test.tsx`, `src/lib/normalizeStatus.test.ts`, `e2e/simulate-event.spec.ts` | Assume the single SH-1060 event and the "already simulated" message. |

## Dependencies and constraints

- Seed dates are relative to `DEMO_NOW_ISO`; customer summaries are hand-written and a seed test
  checks they quote the days of the estimate (PR #29). Every new event needs its own summary.
- Raw event / milestone ids are positional (`<id>-E<n>`, `<id>-M<n>`). If two events touched the
  same shipment, their ids would depend on the order they ran in.
- The customer view must never show internal data (diagnosis, drafts, document check, ERP).
- State is shared between views: an event applied from a customer view is visible to ops.

## Gaps

- A catalogue of events with the shipment, changes and texts of each.
- One script per viewer (ops, and each customer) listing event ids in order.
- A record of applied events in the demo state, so the next one can be picked and reset clears it.
- Toast per event (headline + "View" target) and an "end of script" message.
- Closing exceptions (good-news events) and opening new ones (bad-news events).

## Risks and tricky parts

- An event that is in two scripts (ops and its customer) must apply once and be skipped by the
  other script afterwards.
- Existing E2E counts in the ops inbox ("Need attention 6") rely on the first ops event being the
  SH-1060 roll; keeping it first avoids rewriting those tests.
- Persisted states from `v2` lack the applied-events field: bump the storage key.
- Lots of hand-written content; it must stay consistent with the ETA cards and the inbox order.

## Open questions

- [x] Script per customer or global? → per customer (user).
- [x] Ops too? → ops gets its own script; customer events are visible to ops (user).
- [x] Customer toast action? → "View" to the affected shipment (user).
- [ ] Which events, in which order (proposed in the plan).

## References

- PR #29 (hand-written customer summaries), `docs/decisions/0033` (simulated latency).
