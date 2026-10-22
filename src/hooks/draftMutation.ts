import type { QueryClient } from '@tanstack/react-query'
import type { Shipment } from '@/api/types'
import { EXCEPTIONS_QUERY_KEY, SHIPMENTS_QUERY_KEY } from '@/hooks/useOpsTabCounts'
import { shipmentQueryKey } from '@/hooks/useShipment'

/**
 * Puts the updated shipment into the detail cache, so the screen reflects the new draft at once,
 * and invalidates the inbox, list and tab-count queries that derive from it.
 */
export async function syncAfterDraftChange(queryClient: QueryClient, shipment: Shipment): Promise<void> {
  queryClient.setQueryData(shipmentQueryKey(shipment.id), shipment)
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: EXCEPTIONS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY }),
  ])
}
