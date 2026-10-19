# Decision log

Architecture Decision Records of the decisions **taken by the user** during the project, maintained by the `decision-recorder` agent.

- `Decided by: User` — the user's own decision.
- `Decided by: User, on Claude's proposal` — Claude proposed the idea or the options, and the user decided to adopt it.

Decisions Claude takes on its own are not recorded here (see [0014](0014-decision-log-records-user-decisions.md)).

One file per decision, numbered sequentially: `NNNN-<short-title>.md`. Use [`_TEMPLATE.md`](_TEMPLATE.md). Decisions are never edited to change their outcome: a new ADR supersedes the old one and both are linked.

## Index

| # | Title | Decided by | Status | Date |
| --- | --- | --- | --- | --- |
| [0001](0001-scope-react-and-vite-only.md) | Scope the guidelines to React and Vite | User | Accepted | 2026-10-19 |
| [0002](0002-english-only.md) | Everything is written in English | User | Accepted | 2026-10-19 |
| [0003](0003-research-plan-implement-workflow.md) | Research → Plan → Implement workflow with specialised agents and skills | User | Accepted | 2026-10-19 |
| [0004](0004-shadcn-ui-for-components.md) | shadcn/ui as the component library | User | Accepted | 2026-10-19 |
| [0005](0005-meaningful-jsdoc.md) | Meaningful JSDoc on exported code | User | Accepted | 2026-10-19 |
| [0006](0006-standard-pull-request-body.md) | One fixed structure for every pull request | User | Accepted | 2026-10-19 |
| [0007](0007-qa-agent-on-pull-requests.md) | QA agent validates every pull request from a Claude Code routine | User | Accepted | 2026-10-19 |
| [0008](0008-qa-screenshots-branch.md) | QA screenshots stored in an orphan branch and embedded in PR comments | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0009](0009-full-recommended-stack.md) | Adopt the full recommended stack from the handbook | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0010](0010-linting-and-formatting.md) | ESLint Stylistic, Tailwind class sorting and Stylelint | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0011](0011-claude-code-hooks-and-rules.md) | Claude Code hooks and scoped rules | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0012](0012-code-reviewer-agent.md) | Code reviewer agent | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0013](0013-pull-request-checks-workflow.md) | Pull request checks workflow and a DevOps agent | User | Accepted | 2026-10-19 |
| [0014](0014-decision-log-records-user-decisions.md) | The decision log records only the user's decisions | User | Accepted | 2026-10-19 |
| [0015](0015-screenshots-are-qa-only.md) | Visual evidence is the QA agent's responsibility only | User | Accepted | 2026-10-19 |
| [0016](0016-separate-tsconfig-for-tests.md) | Separate TypeScript project for tests | User, on Claude's proposal | Accepted | 2026-10-19 |
