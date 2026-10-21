# 0058. Shipments API provided through a React context

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4), `docs/implementation/2026-10-20-shipment-visibility-prototype.md` (M2 follow-up), PR #8

## Context

`src/api/shipmentsApi.ts` exports a module-level instance backed by `sessionStorage`. The M2 review left a follow-up: before hooks use it, tests need a way to inject their own isolated instance, otherwise state is shared between tests. M4 introduced the first data hooks (tab counts, reference data, reset demo).

Reason not stated. The user accepted it together with three smaller M4 recommendations.

## Options considered

1. **Provide the API through a React context now** (proposed by Claude, chosen): a provider with the app instance by default; tests inject `createShipmentsApi` with no-op storage and zero latency.
2. **Keep importing the module-level instance and defer the change to M7.**

## Decision

Hooks read the shipments API from a React context, from M4 on. Tests inject their own instance per render.

## Consequences

- Every data hook goes through `useShipmentsApi()`, which fails loudly outside the provider.
- Tests use one shared `createTestApi()` from `src/test/`, so no state leaks between tests.
- A real backend later replaces only the instance passed to the provider.
