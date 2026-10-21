# 0055. Branch names use a slash after the type

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** `CLAUDE.md` §10, `docs/plans/2026-10-20-shipment-visibility-prototype.md` (milestone branches M4–M17), `docs/implementation/_TEMPLATE.md`, PR #6 (`feat-domain-logic`, not renamed)

## Context

`CLAUDE.md` §10 prescribed branches as `feat-<short-description>` or `fix-<short-description>`, and the plan named every milestone branch `feat-<name>`. The user asked for the form to change (translated from Spanish):

> "can we also fix wherever needed that instead of feat-text it is feat/text?"

The user gave no further reason.

## Options considered

1. **`feat-<short-description>` / `fix-<short-description>`** — the MarsBased form already in `CLAUDE.md` §10 and the plan.
2. **`feat/<short-description>` / `fix/<short-description>`** — chosen by the user.

## Decision

Branches are named `feat/<short-description>` and `fix/<short-description>`. Documents that used the hyphen form are updated where they describe future branches.

## Consequences

- `CLAUDE.md` §10, the implementation template and the plan's milestone branches M4–M17 use the slash form.
- Branches already delivered (M1–M3, including the open PR #6 `feat-domain-logic`) keep their names, because renaming the branch of an open PR would close it.
- Existing branch names that use the hyphen form remain in the history and are not renamed.
