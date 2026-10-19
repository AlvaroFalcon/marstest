# 0004. ESLint Stylistic, Tailwind class linting and Stylelint

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User (Claude chose the configuration details)
- **Phase:** Implement
- **Related:** `eslint.config.js`, `.stylelintrc.json`

## Context

The handbook formats code with ESLint Stylistic instead of Prettier, sorts Tailwind classes with a tool, and runs Stylelint (`stylelint-config-standard`) with Tailwind at-rules allowed.

## Decision

- `@stylistic/eslint-plugin` with `customize({ quotes: 'single', semi: false, indent: 2, jsx: true })`, matching the Vite template style.
- `eslint-plugin-better-tailwindcss` (recommended config, entry point `src/index.css`) for class order, duplicates and line wrapping.
- `@tanstack/eslint-plugin-query` for TanStack Query mistakes.
- Extra TypeScript rules enforcing CLAUDE.md: `type` over `interface`, type-only imports, no `any`, no `React.FC`.
- Stylelint with `stylelint-config-standard`, Tailwind at-rules ignored, and number notation for `oklch()` lightness/hue to keep shadcn's token format.
- `npm run lint` runs both; `npm run lint:fix` fixes both.

## Consequences

- shadcn-generated files are reformatted on add (`npm run lint:fix`), which is expected since they are project code.
- `react-refresh/only-export-components` is disabled for `src/components/ui/` because shadcn exports variants next to components.
- `npm audit` reports a high-severity `braces` advisory reachable only through Stylelint's dev-time globbing; it does not ship to the browser. Revisit when Stylelint updates its dependencies.
