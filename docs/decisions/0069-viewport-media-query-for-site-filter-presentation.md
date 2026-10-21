# 0069. Site filter presentation switches by viewport media query

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M7, and the "Responsive strategy" row of the Decisions table), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, branch `feat/exceptions-inbox`

## Context

The plan's responsive strategy says container queries switch the site filter from a popover (desktop) to a bottom sheet (mobile). The plan treats container queries as the default for responsive behaviour. Radix portals render the popover and the sheet outside the component's container, so a container query on the filter's own container cannot see the layout that the portal is shown in.

The user answered the question dialog by choosing "Viewport media-query hook (Recommended)" over "Always a popover". No free-text reason was given.

## Options considered

1. **Viewport media-query hook (`useMediaQuery`) that picks popover or bottom sheet** (proposed by Claude, recommended, chosen). This is an exception to the container-query-first convention.
2. **Always a popover**, on all viewports.

## Decision

The site filter uses a viewport media-query hook to choose between a popover on desktop and a bottom sheet on mobile, instead of a container query. Reason not stated.

## Consequences

- This is a documented exception to the container-query-first convention in `CLAUDE.md` section 7 for portal-based components.
- The breakpoint lives in the hook, so the desktop and mobile behaviour can differ only through that one switch.
- Tests and E2E for the filter must cover both presentations (desktop and mobile projects).
