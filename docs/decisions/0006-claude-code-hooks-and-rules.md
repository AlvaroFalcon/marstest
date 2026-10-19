# 0006. Claude Code hooks and scoped rules

- **Date:** 2026-10-19
- **Status:** Accepted
- **Decided by:** User (Claude chose the implementation details)
- **Phase:** Implement
- **Related:** `.claude/settings.json`, `.claude/hooks/`, `.claude/rules/`

## Context

The AI-augmented development guide recommends enforcing hard rules outside Claude's context with hooks (block secrets, auto-format after edits) and scoping instructions to file types with `.claude/rules/`.

## Decision

- `PreToolUse` hook `block-sensitive-files.mjs`: blocks reading, writing or referencing in shell commands environment files (except `.env.example`), `.netrc`, `.ssh`, `.aws`, `.gnupg`, `.kube` and `.docker`. Heredoc bodies are ignored because they are text, not file accesses. Backed by `permissions.deny` read rules.
- `PostToolUse` hook `lint-fix.mjs`: runs `eslint --fix` (TS/JS) or `stylelint --fix` (CSS) on every edited file and reports remaining problems back to Claude.
- Rules for tests, UI components, pages/routing and lib/hooks/api, loaded only when matching files are touched.

## Consequences

- Claude cannot read local secrets even when asked; developers edit their local environment files themselves.
- Shell commands that mention a secret file name outside a heredoc are blocked (false positives are accepted for safety).
- Hooks are written in Node so they run on any machine with the project's Node version, without `jq`.
