# 0036. The 4-page write-up is a separate RPI cycle after the prototype

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md`, `docs/research/2026-10-20-shipment-visibility-prototype.md`

## Context

The brief includes a 4-page written document alongside the prototype. The question was whether it belongs inside this plan or in its own Research → Plan → Implement cycle.

Reason the user gave: No reason stated beyond accepting the recommendation.

## Options considered

1. **Separate RPI cycle after the prototype** (proposed by Claude, marked Recommended) — the write-up describes what was really built.
2. **Last chunk of this plan** — the write-up is produced in the same plan as the prototype.

## Decision

The 4-page write-up is handled as a separate Research → Plan → Implement cycle after the prototype is built.

## Consequences

- The write-up can describe the prototype as implemented, not as planned.
- Features left out of the prototype, such as the geofence milestone and LangGraph, are described in the write-up only, per [0021](0021-langgraph-only-in-write-up.md) and [0032](0032-geofence-milestone-only-in-write-up.md).
- The write-up has its own plan and decisions, so it needs separate time in the schedule.
