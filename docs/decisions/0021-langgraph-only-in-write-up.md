# 0021. LangGraph is mentioned only in the written document

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The document validation and next-action flows need human approval before anything happens. Claude proposed LangGraph (interrupt plus checkpointer) for those flows in production. The prototype is frontend only with simulated AI, so no backend orchestration exists to run it.

## Options considered

1. **LangGraph in production only, for document validation and next-action flows with human approval** Normalisation, ETA and summaries do not use it.

## Decision

LangGraph is described in the written document as the production orchestration for document validation and next-action flows with human approval. It is not used for normalisation, ETA or summaries, and it is not built in the prototype.

## Consequences

- No LangGraph dependency is added to the project.
- The written document must present LangGraph as a production design choice, not as implemented code.
