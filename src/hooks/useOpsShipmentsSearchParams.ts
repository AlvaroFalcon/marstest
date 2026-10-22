import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'
import {
  DEFAULT_SHIPMENT_SORT,
  SHIPMENT_LIST_STATUSES,
  SHIPMENT_SORTS,
  type ShipmentListQuery,
  type ShipmentListStatus,
  type ShipmentSort,
} from '@/lib/shipmentList'

/**
 * Search params of the ops "All shipments" route. Every field falls back to its default when
 * absent or invalid, and a default is never written to the URL: `site` absent is all my sites,
 * `status` absent is any status, `q` absent is no search, `sort` absent is carrier ETA ascending
 * and `page` absent is the first page.
 */
export const opsShipmentsSearchParamsSchema = z.object({
  site: z.string().min(1).optional().catch(undefined),
  status: z.enum(SHIPMENT_LIST_STATUSES).optional().catch(undefined),
  q: z.string().trim().default('').catch(''),
  sort: z.enum(SHIPMENT_SORTS).default(DEFAULT_SHIPMENT_SORT).catch(DEFAULT_SHIPMENT_SORT),
  page: z.coerce.number().int().min(1).default(1).catch(1),
})

/** @see opsShipmentsSearchParamsSchema */
export type OpsShipmentsSearchParams = z.infer<typeof opsShipmentsSearchParamsSchema>

/** Result of {@link useOpsShipmentsSearchParams}. */
export type UseOpsShipmentsSearchParamsResult = {
  /** The validated view state of the list, ready for `buildShipmentListPage`. */
  query: ShipmentListQuery
  /** Selects a site, or all sites with `null`. Resets to page 1. */
  setSiteId: (siteId: string | null) => void
  /** Selects a status, or any with `null`. Resets to page 1. */
  setStatus: (status: ShipmentListStatus | null) => void
  /**
   * Sets the search text. Replaces the history entry instead of adding one, because it is called
   * while the user types and Back should not step through every pause. Resets to page 1.
   */
  setSearch: (search: string) => void
  /** Sets the sort order. Resets to page 1. */
  setSort: (sort: ShipmentSort) => void
  /** Goes to a page; page 1 removes the param. */
  setPage: (page: number) => void
  /** Removes the site, status and search filters and the page, keeping the sort. */
  clearFilters: () => void
}

type ParamChange = { key: keyof OpsShipmentsSearchParams, value: string | null }

function applyChanges(previous: URLSearchParams, changes: readonly ParamChange[]): URLSearchParams {
  const next = new URLSearchParams(previous)
  for (const { key, value } of changes) {
    if (value === null || value === '') {
      next.delete(key)
    }
    else {
      next.set(key, value)
    }
  }
  return next
}

/**
 * Reads and writes the view state of the ops shipments list in the URL (`?site=&status=&q=&sort=&page=`).
 * Changing the site, status, search or sort resets the page, as the other filters change what
 * page N means. A site that is not in scope is dropped from the URL with `replace`.
 *
 * @param inScopeSiteIds - Ids of the sites the ops user may filter by, or `null` while they are
 * not loaded; validation against the scope waits until they are.
 */
export function useOpsShipmentsSearchParams(inScopeSiteIds: readonly string[] | null): UseOpsShipmentsSearchParamsResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = opsShipmentsSearchParamsSchema.parse({
    site: searchParams.get('site') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
  })

  const isInvalidSite = parsed.site !== undefined && inScopeSiteIds !== null && !inScopeSiteIds.includes(parsed.site)

  useEffect(() => {
    if (isInvalidSite) {
      setSearchParams(previous => applyChanges(previous, [{ key: 'site', value: null }, { key: 'page', value: null }]), { replace: true })
    }
  }, [isInvalidSite, setSearchParams])

  const resetPage: ParamChange = { key: 'page', value: null }

  return {
    query: {
      siteId: isInvalidSite ? null : parsed.site ?? null,
      status: parsed.status ?? null,
      search: parsed.q,
      sort: parsed.sort,
      page: parsed.page,
    },
    setSiteId: siteId => setSearchParams(previous => applyChanges(previous, [{ key: 'site', value: siteId }, resetPage])),
    setStatus: status => setSearchParams(previous => applyChanges(previous, [{ key: 'status', value: status }, resetPage])),
    setSearch: search => setSearchParams(
      previous => applyChanges(previous, [{ key: 'q', value: search.trim() }, resetPage]),
      { replace: true },
    ),
    setSort: sort => setSearchParams(previous => applyChanges(previous, [
      { key: 'sort', value: sort === DEFAULT_SHIPMENT_SORT ? null : sort },
      resetPage,
    ])),
    setPage: page => setSearchParams(previous => applyChanges(previous, [{ key: 'page', value: page <= 1 ? null : String(page) }])),
    clearFilters: () => setSearchParams(previous => applyChanges(previous, [
      { key: 'site', value: null },
      { key: 'status', value: null },
      { key: 'q', value: null },
      resetPage,
    ])),
  }
}
