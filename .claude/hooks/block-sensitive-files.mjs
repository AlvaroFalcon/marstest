#!/usr/bin/env node
/**
 * PreToolUse hook: blocks Claude from reading or writing secrets and credential files
 * (MarsBased AI-augmented development guidelines). `.env.example` stays allowed because
 * it documents the variables without holding real values.
 *
 * Exit code 2 blocks the tool call and shows the message to Claude.
 */
import { readFileSync } from 'node:fs'

const SENSITIVE_PATH_PATTERNS = [
  /(^|\/)\.env(?!\.example$)(\.[^/]*)?$/,
  /(^|\/)\.netrc$/,
  /(^|\/)\.(ssh|aws|gnupg|kube|docker)(\/|$)/,
]

const SENSITIVE_COMMAND_PATTERN = /(^|[\s'"=/])\.env(?!\.example)(\.[\w.-]+)?(\s|$|['"])|\.netrc|\/\.(ssh|aws|gnupg|kube|docker)\//

const input = JSON.parse(readFileSync(0, 'utf8'))
const toolInput = input.tool_input ?? {}

const candidatePaths = [toolInput.file_path, toolInput.path, toolInput.notebook_path].filter(Boolean)
const blockedPath = candidatePaths.find((candidate) =>
  SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(candidate)),
)

// Heredoc bodies are text written somewhere else, not file accesses: mentioning `.env.local`
// in documentation must not block the command. Redirect targets outside the body are still checked.
const HEREDOC_BODY_PATTERN = /<<-?\s*['"]?(\w+)['"]?([^\n]*)\n[\s\S]*?\n\s*\1(?=\s|$)/g

const command = typeof toolInput.command === 'string' ? toolInput.command : ''
const commandWithoutHeredocBodies = command.replace(
  HEREDOC_BODY_PATTERN,
  (_match, delimiter, restOfOpeningLine) => `<<${delimiter}${restOfOpeningLine}`,
)
const isBlockedCommand = SENSITIVE_COMMAND_PATTERN.test(commandWithoutHeredocBodies)

if (blockedPath || isBlockedCommand) {
  const target = blockedPath ?? 'a sensitive file referenced in the command'
  process.stderr.write(
    `Blocked by project hook: access to ${target} is not allowed. `
    + 'Secrets and credentials must never be read or written by Claude. Use .env.example for documentation.\n',
  )
  process.exit(2)
}

process.exit(0)
