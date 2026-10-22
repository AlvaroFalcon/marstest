import { useQuery } from '@tanstack/react-query'
import type { ReferenceData, Shipment } from '@/api/types'
import { NotFoundError } from '@/api/shipmentsApi'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { scopeShipments, type Viewer } from '@/lib/scope'

/** Maximum number of automatic retries of a failed shipment request. */
const MAX_RETRIES = 3

/** Query key of one shipment. */
export function shipmentQueryKey(shipmentId: string): readonly ['shipments', 'detail', string] {
  return ['shipments', 'detail', shipmentId]
}

/**
 * Load state of one shipment. `notFound` covers a missing id and a shipment the viewer may not see
 * alike, so the screen can never reveal which of the two it was.
 */
export type UseShipmentResult
  = | { status: 'loading' }
    | { status: 'error', retry: () => void }
    | { status: 'notFound' }
    | { status: 'ready', shipment: Shipment, referenceData: ReferenceData }

/**
 * Loads one shipment together with the reference data needed to name its customer, site and
 * carriers, scoped to the viewer. It waits for both, so `ready` always has everything to render.
 *
 * A missing shipment is not retried: it will not appear by asking again. Any other failure yields
 * `error`, whose `retry` refetches only the queries that failed.
 */
export function useShipment(shipmentId: string, viewer: Viewer): UseShipmentResult {
  const api = useShipmentsApi()
  const referenceData = useReferenceData()
  const shipment = useQuery({
    queryKey: shipmentQueryKey(shipmentId),
    queryFn: () => api.getShipment(shipmentId),
    retry: (failureCount, error) => !(error instanceof NotFoundError) && failureCount < MAX_RETRIES,
  })

  if (shipment.error instanceof NotFoundError) {
    return { status: 'notFound' }
  }
  if (shipment.isError || referenceData.isError) {
    return {
      status: 'error',
      retry: () => {
        for (const query of [shipment, referenceData]) {
          if (query.isError) {
            void query.refetch()
          }
        }
      },
    }
  }
  if (!shipment.isSuccess || !referenceData.isSuccess) {
    return { status: 'loading' }
  }

  const [visibleShipment] = scopeShipments([shipment.data], viewer, referenceData.data.sites)
  if (visibleShipment === undefined) {
    return { status: 'notFound' }
  }

  return { status: 'ready', shipment: visibleShipment, referenceData: referenceData.data }
}
