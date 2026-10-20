# 0037. Keep next-themes as a dependency for the Sonner theme

- **Date:** 2026-10-20
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (milestone M1, dark mode row), `src/components/ui/sonner.tsx`, `package.json`, `CLAUDE.md` §2

## Context

Running `npx shadcn@latest add sonner` installed the `next-themes` package. The generated `src/components/ui/sonner.tsx` reads the current theme with `useTheme()` from `next-themes`. `next-themes` is not in the agreed stack in `CLAUDE.md` §2.

The plan's dark-mode row says the theme follows the system and is toggled in the demo strip, stored in `localStorage`.

Reason the user gave: "Keep next-themes (Recommended)". No further reason stated.

## Options considered

1. **Keep next-themes** (proposed by Claude, marked Recommended) — `sonner.tsx` stays as generated upstream. The later dark-mode toggle can use `next-themes`' `ThemeProvider` (class attribute, system default, stored in `localStorage`) instead of hand-written logic. Adds about 2 kB and one dependency, to be listed in `CLAUDE.md` §2.
2. **Remove next-themes** — uninstall it and edit `sonner.tsx` so `Toaster` takes its theme from a prop. The dark-mode toggle milestone writes its own small hook. Changes the upstream primitive.

## Decision

Keep `next-themes` as a dependency and keep the generated `sonner.tsx` reading the theme through `next-themes`.

## Consequences

- The upstream shadcn `sonner.tsx` keeps its theme logic; the only local edit removes the unused `toaster` class, which the Tailwind lint rules reject as unknown.
- `next-themes` is an extra dependency outside the stack listed in `CLAUDE.md` §2. It must be added there; this ADR does not change `CLAUDE.md`.
- The dark-mode toggle milestone should use `next-themes`' `ThemeProvider` rather than a hand-written hook.
