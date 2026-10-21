# 0040. Milestones are implemented through the `implement-milestone` skill with a decision gate

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** PR #4 (review that surfaced the issue), `.claude/skills/implement-milestone/`, `.claude/agents/react-vite-expert.md`, `CLAUDE.md` §0

## Context

The M2 milestone was implemented in a general session instead of by the `react-vite-expert` agent. That session chose the "Simulate carrier event" target shipment on its own and recorded it as a note in the pull request, although `CLAUDE.md` §0 says to ask when a decision has several valid options. The code reviewer flagged it. The user said:

> "in the next iterations we must ensure that the milestone development runs on the react vite expert agent and it takes into account what we specified" (translated)

Claude proposed a skill in which the main session coordinates the specialised agents and asks the user before coding. The user approved:

> "I like it, this is what I expected and I didn't do it well, this solution is great" (translated)

## Options considered

1. **General session implements the milestone** — what happened in M2; open choices were noted in the PR.
2. **`implement-milestone` skill (proposed by Claude)** — the main session coordinates `react-vite-expert`, `ui-ux-expert` and `test-expert`. Before coding, the agents return every open choice and the main session asks the user. `react-vite-expert` gets an "Open choices gate". The user does the review before the pull request.

## Decision

Milestones are implemented through the `implement-milestone` skill. Open choices are asked to the user before coding, never settled silently or deferred to PR notes. The user reviews the work before the pull request is opened.

## Consequences

- Every milestone starts with a question round when open choices exist.
- The main session carries more coordination work than a single general session.
- Agents must return open choices instead of deciding them.
