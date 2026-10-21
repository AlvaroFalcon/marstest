# 0059. "Reset demo" and the theme toggle sit on the right of the demo strip

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4), [0034](0034-demo-state-kept-in-session-storage.md), [0060](0060-theme-toggle-two-state-from-system.md)

## Context

The "Reset demo" action required by ADR 0034 and the dark-mode toggle from the plan have no placement in the mockups. The demo strip already holds the "Simulate carrier event" button and the "Demo mode" label.

Reason not stated.

## Options considered

1. **Demo strip, right side:** a small outline "Reset demo" button and an icon-only theme button. On mobile both are icon buttons with accessible labels (proposed by Claude, marked Recommended).
2. **Overflow "⋯" menu** holding both actions.

## Decision

"Reset demo" and the theme toggle are placed on the right side of the demo strip. "Reset demo" is a small outline button. The theme toggle is an icon button. On mobile both stay visible as icon buttons with accessible labels.

## Consequences

- Both controls are visible on every page and viewport, without opening a menu.
- The mobile icon buttons need accessible names; these are part of the M4 acceptance criteria for keyboard and screen-reader use.
- The mockups do not show these controls, so their layout is decided here rather than taken from a design.
