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
| [0007](0007-qa-agent-on-pull-requests.md) | QA agent validates every pull request from a Claude Code routine | User | Accepted · partially superseded by [0041](0041-single-coordinated-review-on-ready-label.md) | 2026-10-19 |
| [0008](0008-qa-screenshots-branch.md) | QA screenshots stored in an orphan branch and embedded in PR comments | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0009](0009-full-recommended-stack.md) | Adopt the full recommended stack from the handbook | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0010](0010-linting-and-formatting.md) | ESLint Stylistic, Tailwind class sorting and Stylelint | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0011](0011-claude-code-hooks-and-rules.md) | Claude Code hooks and scoped rules | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0012](0012-code-reviewer-agent.md) | Code reviewer agent | User, on Claude's proposal | Accepted · partially superseded by [0041](0041-single-coordinated-review-on-ready-label.md) | 2026-10-19 |
| [0013](0013-pull-request-checks-workflow.md) | Pull request checks workflow and a DevOps agent | User | Accepted | 2026-10-19 |
| [0014](0014-decision-log-records-user-decisions.md) | The decision log records only the user's decisions | User | Accepted | 2026-10-19 |
| [0015](0015-screenshots-are-qa-only.md) | Visual evidence is the QA agent's responsibility only | User | Accepted | 2026-10-19 |
| [0016](0016-separate-tsconfig-for-tests.md) | Separate TypeScript project for tests | User, on Claude's proposal | Accepted | 2026-10-19 |
| [0017](0017-claude-md-is-the-only-source.md) | CLAUDE.md is the only source of conventions | User | Accepted | 2026-10-19 |
| [0018](0018-prototype-ai-feature-set.md) | Prototype AI feature set for shipment visibility | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0019](0019-model-computes-eta-llm-explains.md) | The model computes the ETA and the LLM only explains it | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0020](0020-document-validation-ops-only-no-incoterms.md) | Document validation is for operations only; Incoterms modelling is left out | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0021](0021-langgraph-only-in-write-up.md) | LangGraph is mentioned only in the written document | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0022](0022-prototype-screen-set-and-demo-interactions.md) | Prototype screen set and demo interactions | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0023](0023-customer-list-table-desktop-cards-mobile.md) | Customer shipment list is a table on desktop and cards on mobile | User | Accepted | 2026-10-20 |
| [0024](0024-visual-journey-with-arrows.md) | Shipment journey shown as arrow-linked nodes | User | Accepted | 2026-10-20 |
| [0025](0025-ops-all-shipments-and-unified-detail.md) | Operations keep an "All shipments" view and one shipment detail component | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md) | Carrier ETA is always visible and our estimate always shows a date and confidence | User | Accepted | 2026-10-20 |
| [0027](0027-seventy-five-percent-confidence-threshold.md) | 75 % confidence threshold separates watching from predicted delay | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0028](0028-provenance-labels-only-for-derived-dates.md) | Provenance labels only where a date is not plain carrier data | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0029](0029-single-visual-style-for-ai-content.md) | One blue visual style for all AI-generated content | User | Accepted | 2026-10-20 |
| [0030](0030-ui-audit-adjustments-and-inbox-card-styling.md) | UI audit adjustments and inbox card styling | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0031](0031-keep-agreed-mock-data-volume.md) | Keep the agreed mock data volume; mockup counts are illustrative | User | Accepted | 2026-10-20 |
| [0032](0032-geofence-milestone-only-in-write-up.md) | Geofence-detected milestone only in the written document | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0033](0033-in-memory-fake-api-for-runtime-data.md) | Runtime data served by an in-memory fake API | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0034](0034-demo-state-kept-in-session-storage.md) | Demo state kept in sessionStorage with a Reset demo action | User | Accepted | 2026-10-20 |
| [0035](0035-small-feature-milestones-one-pr-each.md) | Delivery in small feature milestones, one branch and one pull request each | User | Accepted | 2026-10-20 |
| [0036](0036-write-up-as-separate-cycle.md) | The 4-page write-up is a separate RPI cycle after the prototype | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0037](0037-keep-next-themes-for-sonner-theme.md) | Keep next-themes as a dependency for the Sonner theme | User, on Claude's proposal | Accepted | 2026-10-20 |
| [0038](0038-simulated-event-rolls-vessel-of-sh-1060.md) | "Simulate carrier event" rolls the vessel of SH-1060 | User, on Claude's proposal | Accepted | 2026-10-21 |
| [0039](0039-aaa-separated-by-blank-lines.md) | Arrange / Act / Assert separated by blank lines, not comments | User | Accepted | 2026-10-21 |
| [0040](0040-milestones-through-implement-milestone-skill.md) | Milestones are implemented through the `implement-milestone` skill with a decision gate | User, on Claude's proposal | Accepted | 2026-10-21 |
| [0041](0041-single-coordinated-review-on-ready-label.md) | One coordinated automated review per pull request, triggered by the `ready-to-test` label | User, on Claude's proposal | Accepted | 2026-10-21 |
