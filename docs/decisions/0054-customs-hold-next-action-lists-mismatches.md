# 0054. Customs-hold next-action suggestion lists document mismatches as well as missing documents

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, PR #6, [0047](0047-document-check-normalised-hs-and-one-percent-weight.md), [0020](0020-document-validation-ops-only-no-incoterms.md)

## Context

The next-action suggestion for a customs hold (`suggestNextAction` in `src/lib/aiText.ts`) tells operations what to do to resolve the hold. The first implementation listed only missing documents. The document check (see [0047](0047-document-check-normalised-hs-and-one-percent-weight.md)) also returns mismatches, for example HS code 8467.29 on SH-1042 against 8467.21 in the ERP order, which can cause a customs hold too.

## Options considered

1. **List mismatches as well as missing documents** (proposed by Claude, recommended).
2. **List only missing documents** (the first implementation).

## Decision

The customs-hold next-action suggestion includes document mismatches (for example the HS code mismatch on SH-1042) in addition to missing documents.

The user's answer: "Yes, include them". Reason not stated.

## Consequences

- Operations see the HS code and weight mismatches in the suggested next steps, not only the missing documents.
- The suggestion text depends on the document check output, so changes to the check's rules also change this text.
