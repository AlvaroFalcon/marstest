# 0034. Demo state kept in sessionStorage with a Reset demo action

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md`, `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The prototype's demo state changes during use: approving a draft, discarding a draft and simulating a carrier event all modify the in-memory data. The question was whether a page reload should keep that progress.

Reason the user gave: No reason stated.

## Options considered

1. **Reset on reload, memory only, plus a "Reset demo" action** (proposed by Claude, marked Recommended) — every reload restores the seed.
2. **Keep state in `sessionStorage` so a reload mid-demo keeps progress, plus a "Reset demo" action** — chosen by the user.

## Decision

Demo state is kept in `sessionStorage`, so a reload during a demo keeps progress. A "Reset demo" action restores the seed.

## Consequences

- A reload during the demo does not lose approved drafts or simulated events.
- State is scoped to the browser tab and is cleared when the tab closes.
- The data layer must handle storage failures; the plan falls back to memory in that case.
- "Reset demo" becomes a required control in the demo strip, covered by acceptance criteria in M4 and M15.
