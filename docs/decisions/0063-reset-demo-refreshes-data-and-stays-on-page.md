# 0063. "Reset demo" refreshes the data in place and stays on the current page

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M2, M4, M15), [0034](0034-demo-state-kept-in-session-storage.md)

## Context

ADR 0034 added a "Reset demo" action that restores the seed. The question was what the app does after the reset: which page it shows and how the screen refreshes.

Reason not stated.

## Options considered

1. **Invalidate all queries, show a "Demo reset" toast, stay on the current page** (proposed by Claude, marked Recommended).
2. **Also navigate to `/ops/exceptions`.**
3. **Full page reload.**

## Decision

"Reset demo" invalidates all queries, shows a "Demo reset" toast, and leaves the user on the current page.

## Consequences

- The reset does not reload the page; the in-memory and `sessionStorage` state must be restored by the data layer's `reset()` (M2).
- The user keeps their place in the demo after a reset.
- M15 and M16 acceptance criteria that refer to the reset apply to this behaviour.
