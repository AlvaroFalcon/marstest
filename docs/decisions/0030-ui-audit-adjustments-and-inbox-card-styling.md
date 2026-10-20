# 0030. UI audit adjustments and inbox card styling

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The ui-ux-expert agent audited the mockups and proposed adjustments. The user reviewed them and decided on the inbox card layout.

## Options considered

1. **Inbox card with the status badge on the left** (previous). Replaced.
2. **Status badge below the text, with a left status bar in the label's colour** (chosen). User: "what if we put it below instead of on the left? and the card's left border with the label's colour" (translated).

Adopted from the audit (proposed, accepted):

- Ops scope made visible: "Ops · Spain sites", "All my sites (3)", out-of-scope site locked.
- "Upload certificate of origin" action added.
- Stale status shown separately from confidence.
- "Delay predicted" label distinct from "Delayed".
- Open row light blue; new-event row light yellow; no yellow highlight in tables.
- Inbox cards: white cards with thin border and soft shadow.

## Decision

Adopt the audit adjustments above and the inbox card layout in option 2.

Deferred by the user to the Plan phase, not decided here: closing the demo story after approval, notifying ops of new exceptions, and the 12 px minimum text size.

## Consequences

- The deferred items must be decided in the Plan phase and then recorded as their own ADRs.
- The "Upload certificate of origin" action is an operations action, consistent with [0020](0020-document-validation-ops-only-no-incoterms.md).
