import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { countOpsTabs, type OpsTabCounts, type OpsTabCountSource } from '@/lib/opsTabCounts'

/** Query key of the shipments that have at least one open exception. */
export const EXCEPTIONS_QUERY_KEY = ['exceptions', 'list']

/** Query key of every shipment. */
export const SHIPMENTS_QUERY_KEY = ['shipments', 'list']

function toSource<Data>(query: UseQueryResult<Data>): OpsTabCountSource<Data> {
  if (query.isError) {
    return { status: 'error' }
  }
  if (query.isSuccess) {
    return { status: 'success', data: query.data }
  }
  return { status: 'pending' }
}

/**
 * Wires the queries behind the ops tab counts; the counting rules live in {@link countOpsTabs}.
 */
export function useOpsTabCounts(): OpsTabCounts {
  const api = useShipmentsApi()
  const referenceData = useReferenceData()
  const exceptions = useQuery({ queryKey: EXCEPTIONS_QUERY_KEY, queryFn: () => api.listExceptions() })
  const shipments = useQuery({ queryKey: SHIPMENTS_QUERY_KEY, queryFn: () => api.listShipments() })

  const sites = toSource(referenceData)

  return countOpsTabs({
    sites: sites.status === 'success' ? { status: 'success', data: sites.data.sites } : sites,
    exceptions: toSource(exceptions),
    shipments: toSource(shipments),
  })
}
