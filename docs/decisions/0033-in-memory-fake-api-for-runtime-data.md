# 0033. Runtime data served by an in-memory fake API

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md`, `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The prototype is frontend-only and uses synthetic data. The app still needs a data layer that the screens can consume the same way they would consume a real backend. The plan's Decisions table lists the runtime data source as the open question.

Reason the user gave: No reason stated beyond accepting the recommendation.

## Options considered

1. **In-memory fake API in `src/api/`** (proposed by Claude, marked Recommended) — async functions over seeded data with about 200 ms simulated latency, consumed through TanStack Query. msw is used only in tests. Simplest to deploy on Vercel; a real API later only changes `src/api`.
2. **msw service worker in the browser** — intercepts real ky calls in production as well. Requires a worker to be served and registered in the deployed build.

## Decision

The prototype serves its runtime data from an in-memory fake API in `src/api/`, consumed through TanStack Query. msw is used only for tests.

## Consequences

- Screens depend only on TanStack Query hooks, so moving to a real backend later means replacing `src/api`.
- No service worker is needed in the browser, which keeps the Vercel deployment simple.
- msw handlers exist only for tests, so the browser demo does not exercise HTTP.
