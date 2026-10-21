# 0056. Pause M4 and rebuild the lost Pencil design first

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4 and M5 onwards), `docs/decisions/0022-prototype-screen-set-and-demo-interactions.md`, `docs/implementation/2026-10-20-shipment-visibility-prototype.md`

## Context

While starting M4 (App shell and role switch), the user found that the Pencil mockup document was never saved to disk. It was lost when the Pencil app was closed. The only surviving copy of the design is 16 screenshots of the frames, kept outside the repository.

The user chose to stop M4 and rebuild the design first. Quote (translated):

> "we lost the design by closing Pencil, let's prioritise rebuilding it ... we pause the milestone and prioritise recovering the design"

The user gave no further reason beyond this.

## Options considered

Alternative to the pause, proposed by Claude and rejected by the user:

- **Continue without mockups** (proposed by Claude) — build M4 from the plan and ADRs only, and fix visual gaps in pre-PR review. The user rejected it and chose to rebuild the design first.

The rebuild parameters below were chosen by the user one by one, each with its alternative. Claude did not propose them as a set.

1. **Location of the design file** — `docs/design/shipment-visibility.pen` inside the repository, versioned (chosen), or outside the repository and unversioned.
2. **Fidelity** — exact copy of the screenshots (texts, numbers such as 142 and 24, layout and states), with the known gaps against the 18-shipment seed kept as noted in ADR 0022 (chosen), or copy and fix the known gaps (seed-based counts, three customers in "Viewing as", consistent mobile role label).
3. **Scope** — everything first: design variables and reusable components (AppHeader, MobileHeader, OpsNav, OpsNavMobile, cards, badges, EtaPair, Journey, AiBlock), then all about 24 desktop and mobile screens (chosen), or only the M4 shell now and the rest before each milestone.
4. **Screenshots in the repository** — copy them into `docs/design/screenshots/` or keep them only outside the repository (chosen).

## Decision

Pause milestone M4 and rebuild the lost design in Pencil before resuming it. The rebuild uses the parameters chosen in Options 1 to 4.

## Consequences

- M4 resumes after the rebuild. Its branch and any work in progress are not affected by this record.
- The `.pen` file in `docs/design/` becomes the design reference for the later milestones.
- The screenshots stay unversioned, so the repository holds no copy of the original visual evidence.
- The rebuilt design may differ from the original where the screenshots are unclear. Any such difference must be recorded in the implementation log.
- Known gaps between the mockup counts and the seed remain open, as in ADR 0022.
