#!/usr/bin/env node
/**
 * Validates a pull request title and body before `gh pr create`. The repository squash-merges
 * using the PR title as the commit header and the PR body as the commit body, so both must
 * already follow the git commit rules in CLAUDE.md §10.
 *
 * Usage: node validate-pr.mjs "<title>" <body-file>
 * Exits with code 1 and lists every problem when the PR does not comply.
 */
import { readFileSync } from 'node:fs'

const TITLE_PATTERN = /^(\[[A-Z][A-Z0-9]*-\d+\] )?(feat|fix|chore|docs|test|deploy)(\([a-z0-9-]+\))?: [a-z0-9].*[^.]$/
const MAX_TITLE_LENGTH = 72
const MAX_BODY_LINE_LENGTH = 100
const REQUIRED_SECTIONS = ['## Description', '## How to test', '## Expected behaviour', '## Acceptance criteria']

const [title, bodyFile] = process.argv.slice(2)

if (!title || !bodyFile) {
  process.stderr.write('Usage: node validate-pr.mjs "<title>" <body-file>\n')
  process.exit(1)
}

const body = readFileSync(bodyFile, 'utf8')
const problems = []

if (!TITLE_PATTERN.test(title)) {
  problems.push('Title must match `[ISSUE-CODE] <type>(<scope>): <subject>` (lowercase subject, no final period).')
}
if (title.length > MAX_TITLE_LENGTH) {
  problems.push(`Title is ${title.length} characters; the maximum is ${MAX_TITLE_LENGTH}.`)
}

for (const section of REQUIRED_SECTIONS) {
  if (!body.includes(section)) problems.push(`Body is missing the "${section}" section.`)
}
if (!/^- \[ \] .+/m.test(body)) {
  problems.push('Acceptance criteria must contain at least one unchecked item (`- [ ] ...`).')
}
const ciOnlyCriteria = body.match(/^- \[ \] .*\b(lint|build|tests?|test:e2e)\b.*\bpass(es)?\b.*$/gim) ?? []
for (const criterion of ciOnlyCriteria) {
  problems.push(`Acceptance criterion only restates a CI check, which CI already enforces: "${criterion}".`)
}
if (body.includes('<!--')) {
  problems.push('Body still contains template comments (`<!-- ... -->`); they would end up in the squash commit.')
}

body.split('\n').forEach((line, index) => {
  if (line.length > MAX_BODY_LINE_LENGTH) {
    problems.push(`Body line ${index + 1} is ${line.length} characters; wrap it at ${MAX_BODY_LINE_LENGTH}.`)
  }
})

if (problems.length > 0) {
  process.stderr.write(`Pull request does not comply:\n${problems.map(problem => `- ${problem}`).join('\n')}\n`)
  process.exit(1)
}

process.stdout.write('Pull request title and body comply with the commit rules.\n')
