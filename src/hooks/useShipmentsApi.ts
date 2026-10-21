import { use } from 'react'
import { ShipmentsApiContext } from '@/api/ShipmentsApiContext'
import type { ShipmentsApi } from '@/api/shipmentsApi'

/**
 * Returns the shipments API provided by the nearest `ShipmentsApiProvider`. Hooks read the API
 * from here instead of importing the singleton so tests can inject an isolated instance.
 *
 * @throws When rendered outside a `ShipmentsApiProvider`.
 */
export function useShipmentsApi(): ShipmentsApi {
  const api = use(ShipmentsApiContext)
  if (!api) {
    throw new Error('useShipmentsApi must be used inside a ShipmentsApiProvider')
  }
  return api
}
