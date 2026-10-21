import { createMockDb } from '@/api/mockDb'
import { createShipmentsApi, type ShipmentsApi } from '@/api/shipmentsApi'

/**
 * Fresh seeded in-memory API with no latency and no-op storage, so tests never share demo state
 * or touch `sessionStorage`. Call it once per test (or render) to get an isolated instance.
 */
export function createTestApi(): ShipmentsApi {
  return createShipmentsApi({
    db: createMockDb({ storage: { getItem: () => null, setItem: () => {} } }),
    latencyMs: 0,
  })
}
