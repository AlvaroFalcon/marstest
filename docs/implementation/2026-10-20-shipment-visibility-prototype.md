# Implementation: Shipment visibility prototype

- **Date:** 2026-10-20
- **Slug:** `shipment-visibility-prototype`
- **Plan:** [`../plans/2026-10-20-shipment-visibility-prototype.md`](../plans/2026-10-20-shipment-visibility-prototype.md)
- **Branch / PR:** one branch and PR per milestone (ADR 0035), listed in the Progress table
- **Status:** In progress

## Progress

| Step | Status | Notes |
| --- | --- | --- |
| M1 · Design tokens and primitives | Done | `feat-design-tokens`. `src/index.css`: off-white page `--background` (cards stay white), `success` / `warning` / `info` with `-foreground` and `-subtle` in oklch for `:root` and `.dark`, all exposed in `@theme inline`. Info is the accent blue for AI content and estimates; danger keeps the existing `destructive` token. Added with `npx shadcn@latest add`: `badge`, `card`, `sheet`, `select`, `tabs`, `table`, `textarea`, `sonner`, `popover`, `tooltip`, `skeleton`, `separator` (existing `button` kept, not overwritten). `transition-all` → `transition-colors` in `badge` and `tabs`; sheet backdrop `bg-black/10` → new `overlay` token; unknown `toaster` class removed from `sonner`. After the `code-reviewer` pass: slide and zoom enter/exit animations in `popover`, `select`, `sheet` and `tooltip` gated with `motion-safe:` (fades kept), and `outline-none` → `outline-hidden` in `select`, `textarea` and `tabs` (CLAUDE.md §7). |
| M2 – M17 | Pending | |

## Deviations from the plan

Every change of direction, with its reason. Deviations decided or approved by the user also get an ADR.

| Step | Planned | Done instead | Reason |
| --- | --- | --- | --- |
| M1 | Only `success`, `warning`, `info` (+ `-subtle`) tokens | Also `-foreground` for each role and an `overlay` token | `-foreground` follows the shadcn token pattern for text on solid fills; `overlay` replaces the raw `bg-black/10` of the sheet backdrop so every primitive colour maps to a token. `overlay` is 10 % black in light (upstream value) but 50 % in dark, because 10 % black barely dims an already dark page. |
| M1 | No new dependencies beyond the agreed stack | `next-themes` and `sonner` installed by the shadcn `sonner` primitive; `next-themes` kept | User decision, [ADR 0037](../decisions/0037-keep-next-themes-for-sonner-theme.md). Added to `CLAUDE.md` §2. |

## Verification

M1:

- [x] `npm run build` passes
- [x] `npm run lint` passes (ESLint incl. Stylistic and better-tailwindcss, Stylelint)
- [x] `npm run test` passes
- [x] Every M1 acceptance criterion of the plan is met

## Follow-ups

Issues to open for work left out.

None so far.
