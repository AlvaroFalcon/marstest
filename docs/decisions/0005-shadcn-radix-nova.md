# 0005. shadcn/ui with Radix primitives and the Nova preset

- **Date:** 2026-10-19
- **Status:** Accepted
- **Phase:** Implement
- **Related:** `components.json`, `src/index.css`

## Context

shadcn/ui (handbook default) now offers several primitive bases (Radix, Base UI, React Aria) and visual presets.

## Options considered

1. **Radix** — the most documented base, largest set of examples.
2. **Base UI / React Aria** — newer, fewer examples.

## Decision

Radix base with the default **Nova** preset (Lucide icons, Geist font, neutral palette), CSS variables enabled, no RTL.

## Consequences

- `ui-ux-expert` may adapt tokens in `src/index.css` to the product's brand; components keep using semantic tokens.
- shadcn's `transition-all` is replaced by explicit transitions, as the CSS guidelines require.
