# 0002. Everything is written in English

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Plan
- **Related:** `CLAUDE.md` §0

## Context

The user works in Spanish with Claude but set a hard rule for every project artefact:

> "ALL documentation, code, agents, files etc. must be in ENGLISH, mandatory and non-negotiable." (translated)

## Options considered

1. **Mixed languages** — documents follow the conversation language.
2. **English only** — one language for code, docs, agents, skills, commits and pull requests.

## Decision

English only, for every file, comment, commit message and pull request, regardless of the conversation language.

## Consequences

- The rule is the first non-negotiable rule in `CLAUDE.md` and is repeated in every agent and skill.
- The user's personal research notes in Spanish are kept out of the repository (untracked) instead of being translated: "leave them as they are, I won't commit them, they are for me" (translated).
