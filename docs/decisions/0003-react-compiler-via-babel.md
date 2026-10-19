# 0003. Enable the React Compiler through Babel

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** Claude
- **Phase:** Implement
- **Related:** `vite.config.ts`

## Context

The handbook asks to enable the React Compiler and stop hand-writing `useMemo`, `useCallback` and `memo`. `@vitejs/plugin-react` 6 offers two integrations: a Rust port (`oxc-transform-react`, marked experimental) and the official Babel plugin through `@rolldown/plugin-babel`.

## Options considered

1. **Rust compiler (`compiler: true`)** — faster builds, but experimental.
2. **Babel plugin (`reactCompilerPreset`)** — the official, stable compiler; the handbook names `babel-plugin-react-compiler` for Vite.

## Decision

Use the Babel integration: `babel({ presets: [reactCompilerPreset()] })` in `vite.config.ts`.

## Consequences

- Manual memoization is forbidden unless profiling proves a need.
- Slightly slower transforms than the Rust port; switch when the Rust compiler becomes stable.
