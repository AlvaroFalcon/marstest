import { useQuery } from '@tanstack/react-query'
import { EXCEPTIONS_QUERY_KEY, SHIPMENTS_QUERY_KEY } from '@/hooks/useOpsTabCounts'
import { useExceptionsSearchParams } from '@/hooks/useExceptionsSearchParams'
import { useNow } from '@/hooks/useNow'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { buildExceptionInbox, type ExceptionInbox } from '@/lib/exceptionInbox'

/** Load state of the ops exceptions inbox; `ready` is the only state that carries data. */
export type UseExceptionsResult
  = | { status: 'loading' }
    | { status: 'error', retry: () => void }
    | {
      status: 'ready'
      inbox: ExceptionInbox
      /** Validated selected site id, or `null` for all my sites. */
      selectedSiteId: string | null
      setSelectedSiteId: (siteId: string | null) => void
    }

/**
 * Loads and derives the ops exceptions inbox: scoped to the ops sites, ordered by urgency, and
 * narrowed by the `?site=` filter, which also drives the KPIs. Tab counts and per-site counts stay
 * unfiltered (see {@link buildExceptionInbox}). Any failed query yields `error`, so a partial
 * inbox is never shown.
 *
 * @returns `error.retry` refetches only the queries that failed.
 */
export function useExceptions(): UseExceptionsResult {
  const api = useShipmentsApi()
  const now = useNow()
  const referenceData = useReferenceData()
  const exceptions = useQuery({ queryKey: EXCEPTIONS_QUERY_KEY, queryFn: () => api.listExceptions() })
  const shipments = useQuery({ queryKey: SHIPMENTS_QUERY_KEY, queryFn: () => api.listShipments() })

  const inScopeSiteIds = referenceData.isSuccess
    ? referenceData.data.sites.filter(site => site.inOpsScope).map(site => site.id)
    : null
  const { siteId, setSiteId } = useExceptionsSearchParams(inScopeSiteIds)

  const queries = [referenceData, exceptions, shipments]
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
  if (!referenceData.isSuccess || !exceptions.isSuccess || !shipments.isSuccess) {
    return { status: 'loading' }
  }

  return {
    status: 'ready',
    inbox: buildExceptionInbox({
      exceptionShipments: exceptions.data,
      shipments: shipments.data,
      sites: referenceData.data.sites,
      siteId,
      now,
    }),
    selectedSiteId: siteId,
    setSelectedSiteId: setSiteId,
  }
}
