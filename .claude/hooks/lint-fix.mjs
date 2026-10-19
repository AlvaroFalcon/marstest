#!/usr/bin/env node
/**
 * PostToolUse hook: after Claude edits a file, auto-fix it with ESLint (TS/JS) or
 * Stylelint (CSS) so formatting never drifts from the project rules. Problems that
 * cannot be auto-fixed are reported back to Claude (exit code 2) to be fixed right away.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const filePath = input.tool_input?.file_path
const projectDirectory = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd()

if (!filePath || !existsSync(filePath)) process.exit(0)

const relativePath = path.relative(projectDirectory, filePath)
const isOutsideProject = relativePath.startsWith('..') || path.isAbsolute(relativePath)
const isIgnored = /(^|\/)(node_modules|dist|qa-artifacts|coverage)\//.test(relativePath)

if (isOutsideProject || isIgnored) process.exit(0)

const extension = path.extname(filePath)
const linterArguments = ['.ts', '.tsx', '.js', '.mjs'].includes(extension)
  ? ['eslint', '--fix', '--no-warn-ignored', filePath]
  : extension === '.css'
    ? ['stylelint', '--fix', filePath]
    : null

if (!linterArguments) process.exit(0)

const result = spawnSync('npx', ['--no-install', ...linterArguments], {
  cwd: projectDirectory,
  encoding: 'utf8',
})

if (result.status !== 0) {
  process.stderr.write(
    `Lint problems remain in ${relativePath} after auto-fix. Fix them before continuing:\n`
    + `${result.stdout}${result.stderr}`,
  )
  process.exit(2)
}

process.exit(0)
