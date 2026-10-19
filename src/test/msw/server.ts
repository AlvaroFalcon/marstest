import { setupServer } from 'msw/node'
import { handlers } from '@/test/msw/handlers'

/** MSW server that intercepts every network request made during unit and component tests. */
export const server = setupServer(...handlers)
