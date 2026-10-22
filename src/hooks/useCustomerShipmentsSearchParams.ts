import { useSearchParams } from 'react-router'
import { z } from 'zod'
import {
  CUSTOMER_SHIPMENT_TABS,
  DEFAULT_CUSTOMER_SHIPMENT_TAB,
  type CustomerShipmentsQuery,
  type CustomerShipmentTab,
} from '@/lib/customerShipments'

/**
 * Search params of the customer shipments route. Every field falls back to its default when
 * absent or invalid, and a default is never written to the URL: `tab` absent is "All", `q`
 * absent is no search and `page` absent is the first page.
 */
export const customerShipmentsSearchParamsSchema = z.object({
  tab: z.enum(CUSTOMER_SHIPMENT_TABS).default(DEFAULT_CUSTOMER_SHIPMENT_TAB).catch(DEFAULT_CUSTOMER_SHIPMENT_TAB),
  q: z.string().trim().default('').catch(''),
  page: z.coerce.number().int().min(1).default(1).catch(1),
})

/** Result of {@link useCustomerShipmentsSearchParams}. */
export type UseCustomerShipmentsSearchParamsResult = {
  /** The validated view state of the list. */
  query: CustomerShipmentsQuery
  /** Selects a tab. Resets to page 1. */
  setTab: (tab: CustomerShipmentTab) => void
  /**
   * Sets the search text. Replaces the history entry instead of adding one, because it is called
   * while the user types and Back should not step through every pause. Resets to page 1.
   */
  setSearch: (search: string) => void
  /** Goes to a page; page 1 removes the param. */
  setPage: (page: number) => void
}

type ParamChange = { key: 'tab' | 'q' | 'page', value: string | null }

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
 * Reads and writes the view state of the customer shipments list in the URL (`?tab=&q=&page=`).
 * Changing the tab or the search resets the page, as they change what page N means.
 */
export function useCustomerShipmentsSearchParams(): UseCustomerShipmentsSearchParamsResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const parsed = customerShipmentsSearchParamsSchema.parse({
    tab: searchParams.get('tab') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? undefined,
  })
  const resetPage: ParamChange = { key: 'page', value: null }

  return {
    query: { tab: parsed.tab, search: parsed.q, page: parsed.page },
    setTab: tab => setSearchParams(previous => applyChanges(previous, [
      { key: 'tab', value: tab === DEFAULT_CUSTOMER_SHIPMENT_TAB ? null : tab },
      resetPage,
    ])),
    setSearch: search => setSearchParams(
      previous => applyChanges(previous, [{ key: 'q', value: search.trim() }, resetPage]),
      { replace: true },
    ),
    setPage: page => setSearchParams(previous => applyChanges(previous, [{ key: 'page', value: page <= 1 ? null : String(page) }])),
  }
}
