# 0041. One coordinated automated review per pull request, triggered by the `ready-to-test` label

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** PR #4 (review that surfaced the issue), `.claude/skills/review-pull-request/`, `.claude/agents/code-reviewer.md`, `.claude/agents/qa-reviewer.md`. Partially supersedes [0007](0007-qa-agent-on-pull-requests.md) and [0012](0012-code-reviewer-agent.md).

## Context

The code reviewer and the QA reviewer acted separately: two voices on the pull request, and the code reviewer did not post at first. The user said:

> "there should be a coordination of both, maybe some agent in the middle that launches both of them, grabs the feedback and resources and then post it all in one comment instead of two" (translated)

Claude proposed a `review-pull-request` skill, because agents cannot launch other agents. The user rejected automatic re-review on every pull request update:

> "no, I'll automate this with a Claude routine as it is now ... it currently launches when the ready-to-test label is added and is removed when the review finishes, in case I want to launch it by hand. This is to avoid costs." (translated)

> "Pre-PR I will review it myself, the agent does it on the PR" (translated)

## Options considered

1. **Separate reviewers, each posting on its own** — status before this decision (ADR 0007 and ADR 0012).
2. **`review-pull-request` skill, one review (proposed by Claude)** — runs `code-reviewer` and `qa-reviewer` in parallel in coordinated mode (they return results and do not post), then merges them into one GitHub review with summary and verdict, acceptance criteria with screenshots, code findings as inline comments and CI status. Removes the label when done.
3. **Automatic review on every pull request update** — rejected by the user for cost reasons.

## Decision

A pull request gets one coordinated review, produced by the `review-pull-request` skill when the `ready-to-test` label is added. The label is removed when the review finishes, so the review can be launched again by hand. The user reviews the code before opening the pull request.

## Consequences

- Reviews run only when the label is added, which limits cost.
- `code-reviewer` and `qa-reviewer` return results to the skill and no longer post on their own when run in coordinated mode.
- This partially supersedes ADR 0007 (QA routine on every pull request) and ADR 0012 (posting only when asked). Their outcomes are unchanged in their files; this record is the replacement for the trigger and posting parts.
