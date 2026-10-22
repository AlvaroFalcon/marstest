import { useQuery } from '@tanstack/react-query'
import type { SiteFilterOption } from '@/components/shipments/SiteFilter'
import { SHIPMENTS_QUERY_KEY } from '@/hooks/useOpsTabCounts'
import { useNow } from '@/hooks/useNow'
import {
  useOpsShipmentsSearchParams,
  type UseOpsShipmentsSearchParamsResult,
} from '@/hooks/useOpsShipmentsSearchParams'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import {
  buildShipmentListPage,
  buildShipmentRows,
  countRowsBySite,
  type ShipmentListPage,
} from '@/lib/shipmentList'

/** Result of {@link useShipments}. */
export type UseShipmentsResult
  = | { status: 'loading' }
    | { status: 'error', retry: () => void }
    | ({
      status: 'ready'
      /** The page of rows to show, already filtered, sorted and sliced by the URL state. */
      list: ShipmentListPage
      /** Sites for the site filter, each with its unfiltered shipment count; out-of-scope sites have 0 and are shown locked. */
      siteOptions: SiteFilterOption[]
      /** Shipments across all my sites, ignoring every filter. */
      totalShipmentCount: number
      /** True when a site, status or search narrows the list. */
      hasActiveFilters: boolean
    } & UseOpsShipmentsSearchParamsResult)

/**
 * Loads the ops "All shipments" list: shipments and reference data through TanStack Query, shaped
 * by the view state in the URL. Shares the shipments query with the tab counts and the inbox, so
 * a simulated carrier event refreshes all three.
 */
export function useShipments(): UseShipmentsResult {
  const api = useShipmentsApi()
  const now = useNow()
  const referenceData = useReferenceData()
  const shipments = useQuery({ queryKey: SHIPMENTS_QUERY_KEY, queryFn: () => api.listShipments() })

  const inScopeSiteIds = referenceData.isSuccess
    ? referenceData.data.sites.filter(site => site.inOpsScope).map(site => site.id)
    : null
  const searchParams = useOpsShipmentsSearchParams(inScopeSiteIds)

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

  const rows = buildShipmentRows(shipments.data, referenceData.data, now)
  const { query } = searchParams

  return {
    status: 'ready',
    list: buildShipmentListPage(rows, query),
    siteOptions: referenceData.data.sites.map(site => ({
      site,
      exceptionCount: site.inOpsScope ? countRowsBySite(rows, site.id) : 0,
    })),
    totalShipmentCount: rows.length,
    hasActiveFilters: query.siteId !== null || query.status !== null || query.search !== '',
    ...searchParams,
  }
}
