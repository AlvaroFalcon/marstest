# 0022. Prototype screen set and demo interactions

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

Claude and the ui-ux-expert agent proposed the screen set and demo behaviour. The user decided several open points. The mockups exist only in the Pencil document, which is not saved to disk yet.

## Options considered and decisions

1. **Raw vs normalised data.** Option A: its own screen. Option B: an in-context side sheet (proposed, chosen). User: "let's follow your recommendation and see if it convinces, otherwise we change it" (translated).
2. **Live milestone.** Triggered by a manual "Simulate carrier event" button in the demo strip, for the demo only (chosen).
3. **Customers in the role selector.** Three customers, with 15 to 20 shipments in total (chosen). User: "let's try it that way" (translated).
4. **Inbox filter.** Filter by site only (chosen). User: "by site" (translated).
5. **Confidence display.** Option A: High / Medium / Low words (proposed by Claude). Option B: percentage, always shown with a date range (chosen). User: "Percentage is better" (translated).
6. **Dark mode.** Supported (chosen). User: "yes, besides it's easy with shadcn" (translated).

## Decision

Adopt the choices in points 1 to 6. The raw/normalised data is an in-context side sheet, the live milestone is a manual demo button, the seed has three customers and 15 to 20 shipments, the inbox filters by site, confidence is a percentage with a date range, and dark mode is supported.

## Consequences

- The seed data (15 to 20 shipments) does not match the counts shown in the mockups ("142" ops shipments, "24" customer shipments). This is an open question in the research.
- Every visible action needs a simulated effect or must be removed.
- Confidence percentages must always appear with their date range.
