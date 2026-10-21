# 0057. "Simulate carrier event" is shown without effect until M15

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4, M15), [0022](0022-prototype-screen-set-and-demo-interactions.md)

## Context

The demo strip needs a "Simulate carrier event" button in M4. Its behaviour (adding the scripted rolled-vessel event) is delivered in M15. ADR 0022 says every visible action needs a simulated effect or must be removed.

Reason not stated.

## Options considered

1. **Hidden until M15** (proposed by Claude, marked Recommended) — no visible control without an effect in M4 to M14.
2. **Disabled, with a tooltip** — visible, but cannot be clicked until M15.
3. **Present and clickable, with no effect until M15** — chosen.

## Decision

The "Simulate carrier event" button is shown and clickable in M4. It has no effect until M15 adds the scripted event. This is a deliberate exception to the consequence of ADR 0022 for the M4 to M14 period.

## Consequences

- From M4 to M14 a visible action does nothing. Reviews of those milestones should not treat this as a missing effect.
- ADR 0022 is not changed; the exception applies only to this button and only until M15.
- M15 must give the button its effect, as in the plan's M15 acceptance criteria.
