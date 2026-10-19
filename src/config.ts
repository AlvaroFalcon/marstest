import { z } from 'zod'

const environmentSchema = z.object({
  VITE_API_URL: z.url().optional(),
})

const environment = environmentSchema.parse(import.meta.env)

/**
 * Single application configuration object. Environment variables are validated once
 * at start-up so a misconfigured deployment fails immediately instead of at first use.
 */
export const config = {
  apiUrl: environment.VITE_API_URL,
  defaultLocale: 'en',
} as const
