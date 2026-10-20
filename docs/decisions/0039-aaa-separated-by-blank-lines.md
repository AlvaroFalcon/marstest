# 0039. Arrange / Act / Assert separated by blank lines, not comments

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User
- **Phase:** Implement
- **Related:** PR #4 (review that surfaced the issue), `CLAUDE.md` §9, `.claude/rules/tests.md`, `.claude/agents/test-expert.md`

## Context

The existing rules required the Arrange / Act / Assert blocks to be "visibly separated with comments", so every test carried `// Arrange`, `// Act` and `// Assert` lines. While reviewing PR #4 the user wrote:

> "All tests have inline comments making a separation of AAA, that is not necessary, a simple new line is fine. Remember that in the proper documentation avoiding to repeat the same mistake." (translated)

and later:

> "I think that separating them into blocks with blank lines is already understandable." (translated)

## Options considered

1. **Keep `// Arrange` / `// Act` / `// Assert` comments** — the rule as written before this decision.
2. **Separate the blocks with a blank line and no comments** — the user's choice.

## Decision

Tests separate Arrange / Act / Assert with blank lines. The AAA comments are not used.

## Consequences

- `CLAUDE.md` §9, `.claude/rules/tests.md` and `.claude/agents/test-expert.md` state the blank-line rule, and the existing tests were updated to match.
- Future agent and documentation changes must not reintroduce AAA comments.
