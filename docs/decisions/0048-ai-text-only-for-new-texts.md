# 0048. Simulated AI text covers only new texts, not seeded strings

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M3), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, [0018](0018-prototype-ai-feature-set.md), [0019](0019-model-computes-eta-llm-explains.md)

## Context

The prototype simulates AI-generated text (see [0018](0018-prototype-ai-feature-set.md)). Some strings already exist in the seed data: the ETA reason, the diagnosis, and existing draft messages. M3 must decide which texts the simulated AI generates.

## Options considered

1. **New texts only** (proposed by Claude, recommended). Covers the customer shipment summary, the next-action suggestion, and the draft body builder for later exceptions.
2. **Also regenerate seeded strings.**

The seeded strings (ETA reason, diagnosis, existing drafts) are excluded from the second option's scope, so they stay as stored.

## Decision

The simulated AI generates only new texts: the customer shipment summary (status and location, estimate with confidence, open exception, "Based on N events"), the next-action suggestion (for example "Ask the carrier to confirm" for watching), and the draft body builder for later exceptions. Seeded strings are not regenerated.

Reason (option description chosen by the user): "new texts only (recommended)". No free-text reason was given.

## Consequences

- Seeded strings remain stable across runs and match the mock data.
- Regeneration is not available in the prototype, so seeded texts cannot change with the simulated model.
- The new texts are the only AI-generated content and use the single AI visual style (see [0029](0029-single-visual-style-for-ai-content.md)).
