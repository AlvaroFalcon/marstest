# 0010. ESLint Stylistic, Tailwind class sorting and Stylelint

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `eslint.config.js`, `.stylelintrc.json`

## Context

Part of the handbook gaps the user decided to adopt. The handbook formats code with ESLint Stylistic instead of Prettier, sorts Tailwind classes with a tool and lints CSS with Stylelint.

## Options considered

1. **Template ESLint config only** — no formatting or CSS rules.
2. **ESLint Stylistic + better-tailwindcss + Stylelint** (proposed by Claude, from the handbook).

## Decision

Format and lint with ESLint Stylistic, `eslint-plugin-better-tailwindcss` and Stylelint; `npm run lint` runs them all.

## Consequences

- Formatting is never done by hand; the post-edit hook (ADR 0011) applies it automatically.
