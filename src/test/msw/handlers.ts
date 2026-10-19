import type { RequestHandler } from 'msw'

/**
 * Default network handlers shared by every test. Tests add or override handlers
 * with `server.use(...)` so each one only declares the responses it cares about.
 */
export const handlers: RequestHandler[] = []
