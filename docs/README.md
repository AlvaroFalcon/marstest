# Documentation

This folder follows the **Research → Plan → Implement (RPI)** workflow described in `CLAUDE.md`.

| Folder | Purpose |
| --- | --- |
| [`research/`](research/) | Research documents: what exists, what is missing, constraints and open questions. No code. |
| [`plans/`](plans/) | Implementation plans: numbered steps referencing files, acceptance criteria and test strategy. |
| [`implementation/`](implementation/) | Implementation logs: progress per step, deviations from the plan and their reasons, verification. |
| [`decisions/`](decisions/) | Architecture Decision Records (ADRs) kept by the `decision-recorder` agent. |

All three RPI documents of one feature share the same file name: `YYYY-MM-DD-<feature-slug>.md`.
Copy the `_TEMPLATE.md` of each folder to start a new document.
