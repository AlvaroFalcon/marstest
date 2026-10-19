---
name: create-pull-request
description: Creates a GitHub pull request whose body always follows the same structure - concise title, description, how to test, expected behaviour and acceptance criteria. Use every time a pull request is opened. The qa-reviewer agent relies on this structure to validate the PR.
---

# Create pull request

The repository only allows **squash merges**, and the squash commit takes the **PR title as its header and the PR body as its message**. The title and body written here therefore become the commit on `main` and must follow the commit rules in `CLAUDE.md` §10.

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
- Max **72 characters**.
- `[ISSUE-CODE]`: the issue-tracker ID in uppercase (e.g. `MARS-456`). Derive it from the branch name when the branch is named after the issue (`mars-456` → `[MARS-456]`); otherwise ask the user whether there is an issue. Omit it only when there is none.

Examples: `feat(shipments): add exception inbox with priority sorting`, `[MARS-42] fix(eta): hide estimated eta when no milestone is confirmed`.

### 4. Write the body

Fill [template.md](template.md):

- **Description**: what the PR does and why, in 2–5 sentences, from the user's point of view. Link the plan and any ADRs.
- **How to test**: numbered, reproducible steps starting from a clean checkout or the preview URL. Exact routes, data and clicks. A person (or `qa-reviewer`) who has never seen the feature must be able to follow them.
- **Expected behaviour**: what should be observed after the steps, including states (loading, empty, error) and responsive/mobile behaviour when relevant.
- **Acceptance criteria**: unchecked checklist (`- [ ]`) of verifiable, observable statements about the app's behaviour. One behaviour per item. Avoid vague wording ("works well", "is fast"). Do not add "lint/build/tests pass" items: the CI workflow enforces them on every PR.
- **Notes**: deviations from the plan, follow-ups, risks. Remove if empty.

Wrap every body line at **100 characters** (Markdown renders wrapped paragraphs normally) and delete every `<!-- ... -->` template comment: both would otherwise break the squash commit rules.

Do not leave placeholder text or empty sections (the optional **Notes** section is removed when empty). Do not add screenshots: visual evidence is the `qa-reviewer` agent's responsibility, and it posts it on the PR.

### 5. Validate

Write the body to a temporary file (never inline long bodies in the shell) and validate title and body:

```bash
node .claude/skills/create-pull-request/validate-pr.mjs "<title>" <tmp-body-file>
```

Fix every reported problem and run it again until it passes. Do not create the PR otherwise.

### 6. Push and create

```bash
git push -u origin HEAD
gh pr create --base main --title "<title>" --body-file <tmp-body-file>
```

Use `--draft` when the user asks for early feedback. Never use `git push -f`; use `--force-with-lease` if a rebase requires it.

### 7. Report

Return the PR URL and the title. Mention that `qa-reviewer` will validate the acceptance criteria.

If the title or body is edited later (`gh pr edit`), run the validation again: whatever the PR says at merge time becomes the commit.
