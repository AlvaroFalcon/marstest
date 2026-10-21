# 0053. Dates in simulated AI texts use the "22 Oct 2026" format

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, PR #6, [0048](0048-ai-text-only-for-new-texts.md)

## Context

The simulated AI texts (see [0048](0048-ai-text-only-for-new-texts.md)) contain dates. The format had been chosen during M3 implementation without a recorded decision. The automated review of PR #6 flagged this, so the user was asked to confirm it.

The implemented format is `Intl.DateTimeFormat` with locale `en-GB`, day numeric, month short, year numeric, and `timeZone: 'UTC'`, which renders as "22 Oct 2026". The UTC time zone makes the output independent of the machine's time zone.

## Options considered

1. **Keep "22 Oct 2026"** (proposed by Claude, recommended).
2. **Another date format.** Not specified by the user.

## Decision

Keep the "22 Oct 2026" format for dates in simulated AI texts, formatted in UTC.

The user's answer: "Keep it". Reason not stated.

## Consequences

- Dates in AI texts look the same on every machine and in every time zone.
- Changing the format later is a new decision and needs a new ADR.
