# 0072. No ternaries that choose JSX

- **Date:** 2026-10-22
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** PR #27, `CLAUDE.md` §5 rule 9, `eslint.config.js`, [0010](0010-linting-and-formatting.md)

## Context

Components chose what to render with ternaries such as `cond ? <A /> : <B />` and
`cond ? <A /> : null`, some of them nested or spanning many lines. The user asked to replace them
with a function that checks the condition and returns one branch or the other, "para dar más
claridad y legibilidad al código" ("to make the code clearer and more readable", translated), and
to write the rule down so future work follows it.

## Options considered

1. **Named module-level component** (proposed by Claude, recommended): props plus `if`/`return`,
   next to the parent. Keeps TypeScript narrowing and gives each branch a name.
2. **Local render function** (`function renderX()` inside the component body): less ceremony, but
   the component body grows and the function closes over local state.
3. **Generic helper** (`renderWhen(condition, whenTrue, whenFalse)`): shortest, but loses
   narrowing on discriminated unions and builds both branches.

Scope options: every ternary with a JSX branch including `: null` (chosen), only JSX versus JSX,
or every ternary in components.

## Decision

Ternaries whose branch is a JSX element or fragment, including `cond ? <X /> : null`, are replaced
by a named module-level component that returns each branch with `if`/`return`. Ternaries that pick
a value (string, prop, class name, message id) stay.

## Consequences

- `CLAUDE.md` §5 rule 9 and the scoped rules for components and pages state the convention.
- ESLint `no-restricted-syntax` fails on a ternary with a literal JSX branch; a ternary between
  variables that hold elements is not detected by lint and is left to code review.
- Files gain small private components; the branch component is where a nullable value is resolved,
  so what it renders receives non-null data (rule 8).
