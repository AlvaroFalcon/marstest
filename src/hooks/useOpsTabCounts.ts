import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { OpsTabCount } from '@/components/layout/OpsTabs'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { scopeShipments } from '@/lib/scope'

/** Query key of the shipments that have at least one open exception. */
export const EXCEPTIONS_QUERY_KEY = ['exceptions', 'list']

/** Query key of every shipment. */
export const SHIPMENTS_QUERY_KEY = ['shipments', 'list']

export type OpsTabCounts = {
  exceptionCount: OpsTabCount
  shipmentCount: OpsTabCount
}

/**
 * Collapses the states of the queries a count depends on into one {@link OpsTabCount}: any error
 * wins, then any pending query, so a number is shown only when every input is loaded.
 */
function toTabCount(queries: readonly UseQueryResult[], count: () => number): OpsTabCount {
  if (queries.some(query => query.isError)) {
    return { status: 'error' }
  }
  if (queries.some(query => query.isPending)) {
    return { status: 'loading' }
  }
  return { status: 'ready', value: count() }
}

/**
 * Counts for the ops tabs: open exceptions and shipments in the ops scope (sites flagged
 * `inOpsScope`, so Lyon is excluded). They deliberately ignore the inbox `?site=` filter.
 */
export function useOpsTabCounts(): OpsTabCounts {
  const api = useShipmentsApi()
  const referenceData = useReferenceData()
  const exceptions = useQuery({ queryKey: EXCEPTIONS_QUERY_KEY, queryFn: () => api.listExceptions() })
  const shipments = useQuery({ queryKey: SHIPMENTS_QUERY_KEY, queryFn: () => api.listShipments() })

  const sites = referenceData.data?.sites ?? []

  return {
    exceptionCount: toTabCount([referenceData, exceptions], () =>
      scopeShipments(exceptions.data ?? [], { role: 'ops' }, sites)
        .reduce((total, shipment) => total + shipment.exceptions.length, 0)),
    shipmentCount: toTabCount([referenceData, shipments], () =>
      scopeShipments(shipments.data ?? [], { role: 'ops' }, sites).length),
  }
}
