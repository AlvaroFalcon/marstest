# 0060. Theme toggle switches between light and dark, starting from the system setting

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4, dark mode row), [0037](0037-keep-next-themes-for-sonner-theme.md), [0059](0059-reset-demo-and-theme-toggle-in-demo-strip.md)

## Context

The plan says the theme follows the system and is toggled in the demo strip, stored in `localStorage`. The toggle type was not fixed. ADR 0037 keeps `next-themes` as a dependency.

Reason not stated.

## Options considered

1. **Two-state sun/moon icon button**, starting from the system preference, storing light or dark in `localStorage` through `next-themes` (proposed by Claude, marked Recommended).
2. **Three-state dropdown** with System, Light and Dark.

## Decision

The theme toggle is a two-state sun/moon icon button. It starts from the system preference and stores the chosen light or dark theme in `localStorage` through `next-themes`.

## Consequences

- Once the user has clicked the toggle, the stored value is light or dark; the toggle does not offer "System" again.
- The toggle needs one icon button, which fits the demo strip on mobile (see 0059).
- The theme provider is `next-themes`' `ThemeProvider`, as ADR 0037 requires.
