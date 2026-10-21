# 0049. Business logic returns structured data; only simulated AI text is plain English

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, [0002](0002-english-only.md)

## Context

The project uses react-intl for UI strings, with messages in `src/locales/` (planned for M4). M3 creates the business logic in `src/lib/`, so it must decide whether that logic returns display text or data. [0002](0002-english-only.md) requires English in code and docs, which is separate from UI copy.

## Options considered

1. **Data out, plain English AI text** (proposed by Claude, recommended). `src/lib/` returns keys and numbers; the UI formats them through locales. Only the simulated AI text is plain English.
2. **Everything through react-intl**, including AI text.

## Decision

`src/lib/` returns structured data (keys, numbers, enums), and the UI formats it through locales from M4. The only plain English strings returned by the logic are the simulated AI texts, which stand in for model output and are not translated.

Reason (option description chosen by the user): "data out + plain AI text (recommended)". No free-text reason was given.

## Consequences

- Business logic stays free of UI copy and easy to unit-test.
- Simulated AI text is not localised, so it stays in English in every locale.
- Display formatting for all non-AI text must be implemented in M4.
