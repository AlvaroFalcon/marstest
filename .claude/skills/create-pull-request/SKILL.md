---
name: create-pull-request
description: Creates a GitHub pull request whose body always follows the same structure - concise title, description, how to test, expected behaviour and acceptance criteria. Use every time a pull request is opened. The qa-reviewer agent relies on this structure to validate the PR.
---

# Create pull request

Every pull request in this project uses the **same body structure** ([template.md](template.md), mirrored in `.github/pull_request_template.md`). The `qa-reviewer` agent parses the **How to test** and **Acceptance criteria** sections, so they are mandatory.

Everything is written in **English**.

## Steps

### 1. Pre-flight checks

```bash
git status                      # no uncommitted changes
git branch --show-current       # must not be main
npm run build && npm run lint   # must pass
npm run test                    # must pass, when the script exists
```

If any check fails, stop and report it. Do not open the PR.

### 2. Gather context

```bash
git fetch origin
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

Also read, when they exist for this branch's feature:
- `docs/plans/<slug>.md` → **Acceptance criteria** (copy them; do not invent new ones).
- `docs/implementation/<slug>.md` → deviations and verification.

If there are no acceptance criteria anywhere, derive them from the changes and **ask the user to confirm them** before creating the PR.

### 3. Write the title

Format (MarsBased git guidelines): `[ISSUE-CODE] <type>(<scope>): <subject>`

- `type`: `feat`, `fix`, `chore`, `docs`, `test`, `deploy`.
- `scope`: optional, the area touched (`shipments`, `ui`, `routing`).
- `subject`: imperative, lowercase, no final period. Concise: what the PR achieves, not how.
- Max **72 characters**. Omit `[ISSUE-CODE]` when there is no issue.

Examples: `feat(shipments): add exception inbox with priority sorting`, `[MARS-42] fix(eta): hide estimated eta when no milestone is confirmed`.

### 4. Write the body

Fill [template.md](template.md):

- **Description**: what the PR does and why, in 2–5 sentences, from the user's point of view. Link the plan and any ADRs.
- **How to test**: numbered, reproducible steps starting from a clean checkout or the preview URL. Exact routes, data and clicks. A person (or `qa-reviewer`) who has never seen the feature must be able to follow them.
- **Expected behaviour**: what should be observed after the steps, including states (loading, empty, error) and responsive/mobile behaviour when relevant.
- **Acceptance criteria**: unchecked checklist (`- [ ]`) of verifiable, observable statements. One behaviour per item. Avoid vague wording ("works well", "is fast").
- **Screenshots**: before/after for UI changes, otherwise remove the section.
- **Notes**: deviations from the plan, follow-ups, risks. Remove if empty.

Do not leave placeholder text or empty sections (except the optional ones, which are removed).

### 5. Push and create

Write the body to a temporary file (never inline long bodies in the shell):

```bash
git push -u origin HEAD
gh pr create --base main --title "<title>" --body-file <tmp-body-file>
```

Use `--draft` when the user asks for early feedback. Never use `git push -f`; use `--force-with-lease` if a rebase requires it.

### 6. Report

Return the PR URL and the title. Mention that `qa-reviewer` will validate the acceptance criteria.
