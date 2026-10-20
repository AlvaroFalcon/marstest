# 0019. The model computes the ETA and the LLM only explains it

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The brief requires that the prototype never invents statuses or ETAs and always separates confirmed data from estimates. The predicted ETA sits next to the carrier ETA, so the source of the estimate must be unambiguous. Claude proposed that a statistical or ML model computes the estimate, with carrier and lane reliability feeding its confidence, and that the LLM is used only to explain why the estimate changed.


## Options considered

1. **Statistical/ML model computes the ETA; LLM explains it**  The estimate is reproducible and the LLM cannot change the date.
2. **LLM computes the ETA.** Not recorded as a separate option in the research.

## Decision

The ETA estimate is produced by a model, and the LLM is limited to a one-line explanation of changes ("Why").

Reason given: the user's words above. The reliability requirement from the brief is the context for the proposal.

## Consequences

- The prototype simulates the model output with synthetic data; no model is trained or run.
- The "Why" line is generated from the same inputs as the estimate and must not introduce new dates.
- Confidence display rules are in [0022](0022-prototype-screen-set-and-demo-interactions.md) and [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md).
