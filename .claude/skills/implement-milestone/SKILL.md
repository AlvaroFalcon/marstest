---
name: implement-milestone
description: Runs the Implement phase for one milestone of an approved plan in docs/plans/ - delegates the work to react-vite-expert, ui-ux-expert and test-expert, stops to ask the user about every choice the plan does not settle, keeps the implementation log, and opens the pull request. Use whenever a milestone (e.g. "M3") of an approved plan is implemented.
---

# Implement milestone

The main session **coordinates**; the specialised agents **implement**. The main session does not write production code or tests itself. It is the only one that can talk to the user, so it owns every question and every decision.

Everything is written in **English** (code, logs, commits, PR), whatever language the conversation uses.

## Inputs

- The plan: `docs/plans/<slug>.md` (status Approved). Stop if there is none.
- The milestone id (e.g. `M3`): its scope, branch name and acceptance criteria come from the plan.

## Steps

### 1. Prepare

```bash
git fetch origin
git switch -c <milestone branch from the plan> origin/main
```

Read `CLAUDE.md`, the milestone section of the plan, the ADRs it references and `docs/implementation/<slug>.md`.

### 2. Decision gate (before any code)

Ask `react-vite-expert` (and `ui-ux-expert` when the milestone has UI) for an **implementation outline only**, without writing code:

- files to create or change and what each does;
- **open choices**: every point where the plan, `CLAUDE.md` or an ADR does not settle the answer and more than one option is valid (which data to use, which shipment or entity, naming of user-visible things, library APIs, behaviour not described, new dependencies). For each: options, recommendation, why.

If there are open choices, **ask the user** (one `AskUserQuestion` call, recommendation first) before continuing. Never pick an option silently, never leave it as a note in the PR or the log for later. Send every user decision to `decision-recorder` (decision, options, the user's words).

### 3. Implement

Delegate, passing the plan section, the outline and the user's decisions:

| Work | Agent |
| --- | --- |
| Types, data, pure logic, hooks, pages, routing, state | `react-vite-expert` |
| Components, layout, visual states, accessibility | `ui-ux-expert` |
| Unit, component and E2E tests for the acceptance criteria | `test-expert` |

Every agent must stop and return, instead of choosing, when a new open choice appears. Then go back to step 2 for that choice only.

### 4. Log

Update `docs/implementation/<slug>.md`: the milestone row in **Progress**, every **Deviation** from the plan with its reason (user-approved deviations link their ADR), and the **Verification** checklist.

### 5. Verify

```bash
npm run build && npm run lint && npm run test
npm run test:e2e   # when routes or critical paths changed
```

Fix failures through the agent that owns the code. Check every acceptance criterion of the milestone and tick it in the log only when it is met.

### 6. Hand over for pre-PR review

Commit (format in `CLAUDE.md` §10) and stop. Give the user a short summary: what changed, decisions taken, deviations, anything unverified. **The user does the pre-PR review**; wait for their go-ahead and apply what they ask through the owning agent.

### 7. Open the pull request

Use the `create-pull-request` skill, copying the milestone's acceptance criteria from the plan. Do not add the `ready-to-review` label: the user adds it when they want the automated review (see the `review-pull-request` skill).

### 8. Review feedback

When the user asks to address review comments, have the owning agent analyse them first and propose fixes; apply only what the user approves, then push and update the log.

## Never

- Write production code or tests from the main session instead of the agents.
- Resolve an open choice by yourself, or defer it to a PR note.
- Open the PR before the user's pre-PR go-ahead.
