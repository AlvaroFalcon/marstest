import { useQuery } from '@tanstack/react-query'
import { SHIPMENTS_QUERY_KEY } from '@/hooks/useOpsTabCounts'
import { useCustomerShipmentsSearchParams, type UseCustomerShipmentsSearchParamsResult } from '@/hooks/useCustomerShipmentsSearchParams'
import { useNow } from '@/hooks/useNow'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import {
  buildCustomerShipmentListPage,
  countCustomerTabs,
  pickProactiveAlert,
  type CustomerTabCounts,
  type ProactiveAlertData,
} from '@/lib/customerShipments'
import { buildShipmentRows, type ShipmentListPage } from '@/lib/shipmentList'

/** Result of {@link useCustomerShipments}. */
export type UseCustomerShipmentsResult
  = | { status: 'loading' }
    | { status: 'error', retry: () => void }
    | ({
      status: 'ready'
      /** The page of rows to show, already filtered by tab and search, ordered and sliced. */
      list: ShipmentListPage
      /** Rows per tab, ignoring the search, for the tab labels. */
      tabCounts: CustomerTabCounts
      /** The shipment to warn about, or `null` when none needs attention. Ignores tab and search. */
      alert: ProactiveAlertData | null
    } & UseCustomerShipmentsSearchParamsResult)

/**
 * Loads the shipments of one customer: the whole list is scoped to `customerId` before anything
 * else is derived, so no other customer's shipment can reach a tab, count, search or alert. Shares
 * the shipments query with the ops screens, so a simulated carrier event or an approved notice
 * refreshes this list too.
 */
export function useCustomerShipments(customerId: string): UseCustomerShipmentsResult {
  const api = useShipmentsApi()
  const now = useNow()
  const referenceData = useReferenceData()
  const shipments = useQuery({ queryKey: SHIPMENTS_QUERY_KEY, queryFn: () => api.listShipments() })
  const searchParams = useCustomerShipmentsSearchParams()

  const queries = [referenceData, shipments]
  if (queries.some(query => query.isError)) {
    return {
      status: 'error',
      retry: () => {
        for (const query of queries) {
          if (query.isError) {
            void query.refetch()
          }
        }
      },
    }
  }
  if (!referenceData.isSuccess || !shipments.isSuccess) {
    return { status: 'loading' }
  }

  const rows = buildShipmentRows(shipments.data, referenceData.data, now, { role: 'customer', customerId })

  return {
    status: 'ready',
    list: buildCustomerShipmentListPage(rows, searchParams.query),
    tabCounts: countCustomerTabs(rows),
    alert: pickProactiveAlert(rows),
    ...searchParams,
  }
}
