# 0020. Document validation is for operations only; Incoterms modelling is left out

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

Claude proposed document validation (checking the documents against the ERP order: missing certificate of origin, HS code mismatch, weight mismatch) and an optional extra that models Incoterms. A market check showed that customers rarely upload documents. Customer document upload is already listed as out of scope in the research.

## Options considered

1. **Customers and operations both validate documents.** Not chosen; customers rarely upload documents according to the market check.
2. **Document validation for operations only; customers can view documents** (proposed by Claude, accepted by user).
3. **Optional Incoterms modelling on top of option 2** (proposed by Claude as optional). Not chosen.

## Decision

Document validation is available to operations only. Customers view documents. The optional Incoterms feature is not included.

The user's words: "first two points makes sense for this scope, let's leave the optional one out, we're not going to overload the project"

## Consequences

- No customer upload flow is built in the prototype.
- Operations get the "Upload certificate of origin" action (see [0030](0030-ui-audit-adjustments-and-inbox-card-styling.md)).
- Incoterms do not appear in data models, screens or the written document.
