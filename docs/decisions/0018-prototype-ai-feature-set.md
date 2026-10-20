# 0018. Prototype AI feature set for shipment visibility

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The tech test asks for AI as a visible, central part of a frontend-only prototype (synthetic data, simulated AI, 8 hours). The user proposed six AI capabilities: LLM delay/disruption prediction, real-time milestone updates, route optimisation, carrier performance, unexpected-cost detection and document validation. Claude assessed each against the brief and proposed a reduced set. The user accepted the resulting list.

## Options considered

1. **The user's six proposed capabilities as they were.** Route optimisation and freight cost auditing were judged outside the brief: the shipper does not plan routes, and cost auditing belongs to a different product category.
2. **Reduced set (proposed by Claude, accepted by user):** status normalisation, predicted ETA, document validation, prioritised exceptions inbox with next action and AI draft, visible freshness with live milestone, natural-language customer summary.
   - Carrier and lane reliability are used only as inputs to ETA confidence and exception priority, with no scorecard screen.
   - Demurrage cost appears only as urgency inside the exceptions.

## Decision

The prototype implements the reduced set in option 2. Route optimisation, carrier scorecard and freight cost auditing are out of scope.

Reason: Didn't make sense to make that lot of things, better focus on less and assure quality. But it is worth to mention.

## Consequences

- No route, scorecard or cost-audit screens are built or planned for the prototype.
- Each accepted capability maps to screens and states recorded in [0022](0022-prototype-screen-set-and-demo-interactions.md) and [0025](0025-ops-all-shipments-and-unified-detail.md).
- Production approaches per feature are described only in the written document.
