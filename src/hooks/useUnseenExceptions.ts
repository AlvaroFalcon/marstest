import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'

/** Query key of the shipment ids whose exception ops have not opened yet. */
export const UNSEEN_EXCEPTIONS_QUERY_KEY = ['exceptions', 'unseen']

/**
 * Ids of the shipments whose exception is "new" to ops (raised by the simulated carrier event).
 * Empty while loading or on error: the marker is a hint, so it must never block the inbox.
 */
export function useUnseenExceptionShipmentIds(): readonly string[] {
  const api = useShipmentsApi()
  const unseen = useQuery({
    queryKey: UNSEEN_EXCEPTIONS_QUERY_KEY,
    queryFn: () => api.listUnseenExceptionShipmentIds(),
  })

  return unseen.data ?? []
}

/**
 * Clears the "new" marker of one shipment through the fake API and refreshes the unseen ids.
 * Failures are ignored on purpose: the marker simply stays until the next open.
 */
export function useMarkExceptionSeen() {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (shipmentId: string) => api.markExceptionSeen(shipmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: UNSEEN_EXCEPTIONS_QUERY_KEY }),
  })
}
