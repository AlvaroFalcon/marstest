# Plan: Scripted carrier events per viewer

- **Date:** 2026-10-23
- **Slug:** `scripted-carrier-events`
- **Research:** [`../research/2026-10-23-scripted-carrier-events.md`](../research/2026-10-23-scripted-carrier-events.md)
- **Status:** Approved

## Summary

"Simulate carrier event" applies, on every click, the next event of the current viewer's script.
Each customer has three events on their own shipments, mixing good and bad news; ops have a script
that starts with the existing SH-1060 vessel roll. Events live in one catalogue and apply once,
whichever view triggers them.

## Decisions

| Decision | Options considered | Chosen | Decided by | ADR |
| --- | --- | --- | --- | --- |
| What a click does | Fixed script per customer / one global script / random | Fixed script per customer | User | — |
| Ops | Own script / unchanged / separated from customers | Own script; customer events also show in ops | User | — |
| Customer toast | "View" to the shipment / no action | "View" to the affected shipment | User | — |
| One event per shipment | Several per shipment / one | One, so raw event and milestone ids never depend on run order | Claude | — |
| Ops script order | — | SH-1060 roll first (keeps the current demo story), then the rest | Claude | — |

## Event catalogue (proposal, to approve)

| Id | Viewer script | Shipment | What happens | Exceptions |
| --- | --- | --- | --- | --- |
| `vessel-rolled-sh-1060` | Brenner 1, Ops 1 | SH-1060 | Container rolled to the next sailing (today's event) | Opens vessel rolled |
| `rotterdam-congestion-sh-1053` | Nordwerk 1, Ops 2 | SH-1053 | Vessel waits at Rotterdam anchorage, ETA +1 day | Opens predicted delay |
| `customs-cleared-sh-1042` | Nordwerk 2, Ops 3 | SH-1042 | UK customs releases the container, truck leaves Southampton | Closes customs hold |
| `driver-swap-sh-1035` | Nordwerk 3, Ops 4 | SH-1035 | A second driver takes over at Mâcon, truck back on the road to Munich | Closes predicted delay |
| `border-cleared-sh-1037` | Alpen 1, Ops 5 | SH-1037 | Truck clears Basel border, ETA earlier than the last estimate | Closes predicted delay |
| `picked-up-sh-1066` | Alpen 2, Ops 6 | SH-1066 | Picked up at Barcelona warehouse | — |
| `delivered-sh-1033` | Alpen 3, Ops 7 | SH-1033 | Delivered in Basel on time, proof of delivery received | — |
| `carrier-update-sh-1029` | Brenner 2, Ops 8 | SH-1029 | Carrier finally reports: unloaded in Seville | Closes stale tracking |
| `out-for-delivery-sh-1048` | Brenner 3, Ops 9 | SH-1048 | Out for delivery in Lisbon | — |

Every event carries: raw carrier message, milestone, carrier ETA, estimated ETA with reason,
hand-written customer summary, toast headline, and the exception it opens (diagnosis + pending
draft) or the exceptions it closes. When a script is finished the toast says "No more events here.
Reset the demo to run them again."

## Steps

1. **Event model and catalogue** — `src/api/seed.ts`, `src/api/types.ts`
   - Replace `createSimulatedCarrierEvent` and the `SIMULATED_*` constants with a typed
     `ScriptedCarrierEvent` catalogue (`createScriptedEvents(receivedAt, demoNow)`), and the
     scripts `OPS_EVENT_SCRIPT` and `CUSTOMER_EVENT_SCRIPTS` (customer id → event ids).
   - Add `appliedEventIds: string[]` (default `[]`) to `demoStateSchema`.
2. **Apply the next event** — `src/api/shipmentsApi.ts`, `src/api/mockDb.ts`
   - `simulateCarrierEvent(viewer)` picks the first event of the viewer's script not in
     `appliedEventIds`, applies it (milestones, raw events, legs, ETAs, summary, open/close
     exceptions, unseen marker when it opens one) and returns
     `{ kind: 'applied', shipment, event }` or `{ kind: 'scriptFinished' }`.
   - Bump the storage key to `v3`; `reset()` clears `appliedEventIds`.
3. **Toast and navigation** — `src/hooks/useSimulateCarrierEvent.ts`, `src/locales/en.ts`
   - Pass the viewer; toast shows the event headline. "View" opens the exception (ops, when the
     event opens one), the ops shipment detail (ops, otherwise) or the customer shipment detail.
   - New message for a finished script; drop "Already simulated".
4. **Tests** — unit (seed catalogue consistency, API apply/skip/finish/reset), hook (toast and
   navigation per viewer), `Router.test.tsx`, and `e2e/simulate-event.spec.ts` (customer clicks
   three events and gets the finished message; View opens their shipment; ops flow unchanged for
   the first click).

## Acceptance criteria

- [ ] In a customer view, each click applies the next event on one of that customer's shipments,
      and the toast names that shipment
- [ ] The customer toast has a "View" action that opens the affected shipment in the customer view
- [ ] After the third click in a customer view, the toast says there are no more events and nothing
      changes
- [ ] In ops, the first click still rolls the SH-1060 vessel and "View" opens its exception
- [ ] Further ops clicks apply the remaining events in order, opening or closing exceptions in the
      inbox
- [ ] An event applied from a customer view is skipped by the ops script and shows in ops
- [ ] Each changed shipment's customer summary and "Our estimate" quote the same days
- [ ] "Reset demo" restores the seed and every script starts again from its first event

## Test strategy

| Level | What is covered | Files |
| --- | --- | --- |
| Unit (Vitest) | Catalogue: one event per shipment, ids follow seeded positions, summaries quote estimate days, scripts only reference the customer's own shipments. API: next event, skip applied, finished, reset | `src/api/seed.test.ts`, `src/api/shipmentsApi.test.ts`, `src/api/mockDb.test.ts` |
| Component (RTL) | Toast text and View target per viewer, finished message | `src/hooks/useSimulateCarrierEvent.test.tsx`, `src/Router.test.tsx` |
| E2E (Playwright) | Customer three-click script with View; ops first click unchanged; reset | `e2e/simulate-event.spec.ts` |

## Out of scope

- Undo of a single event (only "Reset demo").
- Events generated from data instead of a script.
- Ops texts beyond the diagnosis and draft of the exceptions the events open.
