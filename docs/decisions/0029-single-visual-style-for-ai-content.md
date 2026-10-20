# 0029. One blue visual style for all AI-generated content

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The mockups used different styles for AI-generated blocks across screens. The user compared them and chose the one already used for AI-generated content in the ops mockup OPS6.

## Options considered

1. **Different styles per screen** (previous state). Replaced.
2. **One blue block style, labelled "AI …" with a "Based on N events" link** (chosen).

## Decision

All AI-generated content uses the blue style from OPS6.

The user's words: "if I had to choose I'd take what's in OPS6, which matches the colours we use for AI-generated content".

## Consequences

- AI blocks (exception diagnosis, AI draft, customer summary, "Why" line) share one component style.
- Blue is also used for estimates that deviate from the carrier ETA (see [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md)), so the AI block must always carry the "AI" label to stay distinguishable.
