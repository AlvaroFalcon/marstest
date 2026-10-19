import { z } from 'zod'

/**
 * Validates the raw `import.meta.env` values. Vite exposes a variable declared without a
 * value (`VITE_API_URL=` in `.env.local`) as an empty string, so empty strings are treated
 * as "not set" instead of failing URL validation.
 */
export const environmentSchema = z.object({
  VITE_API_URL: z.preprocess(
    value => (value === '' ? undefined : value),
    z.url().optional(),
  ),
})

export type Environment = z.infer<typeof environmentSchema>

const environment = environmentSchema.parse(import.meta.env)

/**
 * Single application configuration object. Environment variables are validated once
 * at start-up so a misconfigured deployment fails immediately instead of at first use.
 */
export const config = {
  apiUrl: environment.VITE_API_URL,
  defaultLocale: 'en',
} as const
