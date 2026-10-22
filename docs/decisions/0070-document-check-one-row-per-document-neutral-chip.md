# 0070. Document check shows one row per document with a neutral chip

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M8), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, [0047](0047-document-check-normalised-hs-and-one-percent-weight.md), [0029](0029-single-visual-style-for-ai-content.md), [0054](0054-customs-hold-next-action-lists-mismatches.md)

## Context

`checkDocuments` (see [0047](0047-document-check-normalised-hs-and-one-percent-weight.md)) returns one finding per document field (HS code, gross weight), plus missing and pending findings. The OPS mockup shows one row per document, a blue AI-styled chip "Cross-checked against ERP order PO-88213" and the text "Missing · cause of the hold". M8 must decide how findings map to rows and how the chip is styled.

The check is rule-based, not AI-written. [0029](0029-single-visual-style-for-ai-content.md) reserves the blue AI style for AI-generated content and for estimates that deviate from the carrier ETA.

## Options considered

1. **One row per document, worst finding wins** (proposed by Claude, recommended). Severity order: missing > mismatch > pending > match. Neutral, non-AI chip. "· cause of the hold" only for a missing certificate of origin on a customs-hold exception.
2. **Same rows with the blue AI chip** as in the mockup. The fields are AI-extracted.
3. **One row per finding**, so a document can appear twice (for example HS code and weight).

## Decision

The document check shows one row per document. Each row shows the worst finding for that document (missing > mismatch > pending > match). The chip is neutral and not AI-styled. The "cause of the hold" text appears only for a missing certificate of origin on a customs-hold exception.

The user's answer at the decision gate: "Per doc, neutral chip (Recommended)". No reason was given in free text; the user selected the recommended option.

## Consequences

- Each document appears once in the list, so the list length equals the number of documents.
- The mockup's blue AI chip is not used. The blue style stays reserved for AI-generated content and deviating estimates ([0029](0029-single-visual-style-for-ai-content.md)).
- A document with both an HS code mismatch and a weight mismatch shows only the worse finding in its row, so the per-field finding is not a separate row.
