# 0058. "Viewing as" role switch is a select on desktop and mobile

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4), [0022](0022-prototype-screen-set-and-demo-interactions.md)

## Context

The header needs a "Viewing as" control to switch between four roles: "Ops · Spain sites" and the three customers. The desktop mockup shows a two-segment control (Ops | Customer). The mockups do not cover the mobile header for this control.

Reason not stated.

## Options considered

1. **shadcn `Select` on desktop and mobile** (proposed by Claude, marked Recommended) — one control for all four roles on both viewports.
2. **Segmented control "Ops | Customer ▾"** — two segments, with a select for the customer.
3. **Segmented control with four options** — all roles visible as segments.

## Decision

The "Viewing as" control is a shadcn `Select` with the four roles, on desktop and on mobile.

## Consequences

- The desktop mockup's two-segment control is not used; the select replaces it.
- One control and one set of roles is used on both viewports, so no separate mobile variant is needed.
- The role list must stay in sync with the seed's customers and the ops scope.
