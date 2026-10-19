import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import pluginQuery from '@tanstack/eslint-plugin-query'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', 'qa-artifacts']),
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Formatting is done by ESLint Stylistic instead of Prettier (MarsBased React guidelines §1.9).
      stylistic.configs.customize({ quotes: 'single', semi: false, indent: 2, jsx: true }),
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      betterTailwindcss.configs.recommended,
    ],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/index.css',
      },
    },
    rules: {
      'better-tailwindcss/enforce-consistent-line-wrapping': ['warn', { printWidth: 120 }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSTypeReference[typeName.left.name="React"][typeName.right.name="FC"]',
          message: 'Type props with a named, exported `XProps` type instead of React.FC (CLAUDE.md §5).',
        },
      ],
    },
  },
  {
    // shadcn/ui primitives export components and their variants from the same file by design.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['*.config.{ts,js}', 'e2e/**/*.ts', '.claude/hooks/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
