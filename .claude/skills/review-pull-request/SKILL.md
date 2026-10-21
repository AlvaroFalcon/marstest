---
name: review-pull-request
description: Coordinates the automated review of a pull request - runs code-reviewer and qa-reviewer in parallel, merges their findings and posts ONE GitHub review (summary, acceptance criteria with screenshots, CI status and inline comments), then removes the ready-to-test label. Use from the Claude Code routine triggered by the ready-to-test label, or manually with a PR number.
---

# Review pull request

One review per run, one voice. `code-reviewer` (code, conventions, CI) and `qa-reviewer` (behaviour in the running app, screenshots) never post anything themselves: this skill collects their results and publishes a single GitHub review.

It runs in the **main session** because only the main session can launch agents (agents cannot start other agents). It usually runs unattended from a routine: never stop to ask questions; when something blocks, say so in the review and finish.

Everything written to the PR is in **English**.

## Inputs

- The pull request number (from the routine trigger, the caller, or `gh pr view --json number` on the current branch).
- `gh` authenticated with write access (to post the review, push screenshots to `qa-screenshots` and edit labels).

## Steps

### 1. Read the pull request

```bash
gh pr view <n> --json number,title,body,headRefName,headRefOid,url,labels,files
gh pr checks <n>
```

### 2. Run both reviewers in parallel

Launch both agents in the same message, each told it is running **in coordinated mode** (return results, post nothing):

- `code-reviewer` with the PR number → returns its draft review and its findings, each with severity, file, line (a line of the PR diff when it applies) and text citing the rule.
- `qa-reviewer` with the PR number (and the preview URL if a Vercel preview is posted on the PR) → returns the per-criterion results, the report sections and the screenshot URLs it published to `qa-screenshots`.

If one agent fails or times out, continue with the other and state in the review which part is missing and why.

### 3. Merge into one review

Write `review-artifacts/pr-<n>/review.md` (git-ignored) with this structure:

```markdown
<!-- pr-review -->
## Review — <✅ Ready for human review | ❌ Changes needed | ⚠️ Incomplete review>

**Summary:** <2–4 sentences: overall state, blockers, failing criteria>

### Acceptance criteria (QA in the running app)
| # | Criterion | Result |
| --- | --- | --- |
| 1 | ... | ✅ Pass / ❌ Fail / ⚠️ Not verifiable / Covered by CI |

<failing criteria expanded: steps, expected, actual, screenshot>
<passing evidence collapsed in <details>>

### Code review
**Blocking** · **Suggestions** · **Nits** — only the findings that are not posted as inline comments, plus a one-line pointer to the inline ones.

### What is good
- ...

### CI checks
Lint ✅ · Build ✅ · Unit tests ✅ · E2E tests ✅ · Preview ✅

### Other observations
- console errors, mobile layout, anything QA noticed outside the criteria
```

Verdict: ❌ when there is any blocking finding or failing criterion; ⚠️ when a reviewer could not run or a criterion is not verifiable; otherwise ✅. Remove duplicates (the same issue found by both reviewers appears once, under QA if it is visible in the app).

### 4. Post a single review

Post the body and every inline finding in one call (inline comments only on lines that are part of the diff; anything else stays in the body):

```bash
gh api repos/<owner>/<repo>/pulls/<n>/reviews -X POST --input review-artifacts/pr-<n>/review.json
```

`review.json`: `{"commit_id": "<headRefOid>", "event": "COMMENT", "body": "<review.md>", "comments": [{"path": "src/...", "line": 42, "side": "RIGHT", "body": "**[suggestion]** ... (CLAUDE.md §6)"}]}`. Always `COMMENT`: never approve, request changes or merge.

### 5. Remove the trigger label

Always, also when the review failed, so the user can add it again to re-run:

```bash
gh pr edit <n> --remove-label ready-to-test
```

## Rules

- Never push to the PR branch, never merge, never approve. The only branch written to is `qa-screenshots` (by `qa-reviewer`).
- Do not re-run lint, build or tests: CI runs them; report `gh pr checks`.
- Comments use "we", give an objective reason and an alternative (`CLAUDE.md` §10).

## Final output

The verdict, the counts (criteria passed / failed / not verifiable; blocking / suggestions / nits) and the review URL.
