# 0004. shadcn/ui as the component library

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `.claude/agents/ui-ux-expert.md`, `components.json`

## Context

The user asked for a UI/UX expert agent and chose its component library:

> "UI/UX expert, uses shadcn for simplicity." (translated)

shadcn/ui is also the handbook's default component library.

## Options considered

1. **Custom components from scratch** — full control, much more work.
2. **shadcn/ui** — accessible primitives copied into the project, styled with Tailwind tokens.

## Decision

Use shadcn/ui for every UI primitive; the `ui-ux-expert` agent reaches for an existing shadcn component before building anything custom.

## Consequences

- Components live in `src/components/ui/` and are treated as project code.
- Implementation details (Radix base, Nova preset) were set during scaffolding and can be changed by the user at any time.
