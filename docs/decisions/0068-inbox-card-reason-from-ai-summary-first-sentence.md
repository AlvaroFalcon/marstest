# 0068. Inbox card reason line is the first sentence of the AI diagnosis summary

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M7), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/exceptions-inbox`; see also [0029](0029-single-visual-style-for-ai-content.md), [0048](0048-ai-text-only-for-new-texts.md)

## Context

Each exception card in the inbox shows a reason line. The seed has no separate reason field; the exception already has an AI diagnosis summary. Three sources were on the table for the reason line, and each one has a different effect on the seed data and the data model.

The user answered the question dialog by choosing "First sentence of AI summary (Recommended)". No free-text reason was given.

## Options considered

1. **First sentence of the AI diagnosis summary** (proposed by Claude, recommended, chosen). No data model change.
2. **New `reason` field in the seed.** Adds seed data and a model field for each exception.
3. **Templated text per exception type in `lib`.** Adds text templates for each type, independent of the AI summary.

## Decision

The reason line on an inbox card is the first sentence of the exception's AI diagnosis summary. Reason not stated.

## Consequences

- The card shows AI-derived text without an AI label. This departs from the single visual style for AI content in [0029](0029-single-visual-style-for-ai-content.md); the card text must be revisited if the label rule changes.
- No change to the data model or seed is needed.
- If a summary's first sentence is unclear on its own, the reason line is unclear too; the seed texts must be checked against this rule.
