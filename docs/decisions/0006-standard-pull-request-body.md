# 0006. One fixed structure for every pull request

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `.claude/skills/create-pull-request/`, `.github/pull_request_template.md`

## Context

The user asked for a skill to create pull requests so that:

> "the body is always the same: a concise title, a description of what it should do, steps to test it and the expected behaviour, together with the acceptance criteria." (translated)

## Options considered

1. **Free-form PR descriptions** — no effort, inconsistent and hard to validate.
2. **Fixed structure enforced by a skill** — consistent and machine-readable.

## Decision

Every pull request is created with the `create-pull-request` skill: concise title, Description, How to test, Expected behaviour and Acceptance criteria.

## Consequences

- The structure is mirrored in `.github/pull_request_template.md` for PRs opened by hand.
- The `qa-reviewer` agent relies on the **How to test** and **Acceptance criteria** sections.
