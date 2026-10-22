import { orderBy } from 'es-toolkit'
import {
  splitSearchTerms,
  paginateShipmentRows,
  sortShipmentRows,
  type ShipmentListPage,
  type ShipmentListRow,
} from '@/lib/shipmentList'

/** Tabs of the customer list, in display order. The string is also the `tab` value in the URL. */
export const CUSTOMER_SHIPMENT_TABS = ['all', 'needsAttention', 'inTransit', 'delivered'] as const

/** @see CUSTOMER_SHIPMENT_TABS */
export type CustomerShipmentTab = typeof CUSTOMER_SHIPMENT_TABS[number]

/** Tab shown when the URL names none; never written to the URL. */
export const DEFAULT_CUSTOMER_SHIPMENT_TAB: CustomerShipmentTab = 'all'

/** Number of shipments in each tab, for the tab labels. */
export type CustomerTabCounts = Record<CustomerShipmentTab, number>

/** View state of the customer list; this is what the URL holds. */
export type CustomerShipmentsQuery = {
  tab: CustomerShipmentTab
  /** Free text; empty means no search. */
  search: string
  /** One-based page; values past the last page are clamped. */
  page: number
}

/**
 * Data of the proactive alert, as structured values: the components format the sentence. It holds
 * the whole row on purpose, so the message can only use fields that are safe for customers.
 */
export type ProactiveAlertData = {
  /** The most urgent shipment that needs the customer's attention. */
  row: ShipmentListRow
  /** How many other shipments alert too; 0 hides the "+N more" link. */
  additionalCount: number
}

/**
 * Tells whether a row belongs to a tab. The tabs overlap on purpose: a shipment with no recent
 * update is both "In transit" and "Needs attention", and "All" holds everything.
 */
export function matchesCustomerTab(row: ShipmentListRow, tab: CustomerShipmentTab): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'needsAttention':
      return row.status === 'atRisk' || row.status === 'stale'
    case 'inTransit':
      return row.status !== 'delivered'
    case 'delivered':
      return row.status === 'delivered'
  }
}

/** Counts the rows of every tab. */
export function countCustomerTabs(rows: readonly ShipmentListRow[]): CustomerTabCounts {
  return {
    all: rows.length,
    needsAttention: rows.filter(row => matchesCustomerTab(row, 'needsAttention')).length,
    inTransit: rows.filter(row => matchesCustomerTab(row, 'inTransit')).length,
    delivered: rows.filter(row => matchesCustomerTab(row, 'delivered')).length,
  }
}

/**
 * Picks the shipment the proactive alert is about. A shipment alerts when it is at risk or its
 * customer notice was sent; tracking that merely went quiet never alerts, because it says nothing
 * the customer can act on. A delivered shipment never alerts either.
 *
 * Alerting shipments are ordered by the urgency of their most urgent exception (same order as the
 * ops inbox), then by id so the choice is stable. A shipment at risk without an exception (a
 * predicted delay) ranks after those that have one.
 *
 * @returns `null` when no shipment alerts.
 */
export function pickProactiveAlert(rows: readonly ShipmentListRow[]): ProactiveAlertData | null {
  const alerting = orderBy(
    rows.filter(row => row.status !== 'delivered' && (row.status === 'atRisk' || row.isCustomerNotified)),
    [row => row.exceptionUrgencyRank ?? Number.MAX_SAFE_INTEGER, row => row.id],
    ['asc', 'asc'],
  )
  const [first] = alerting

  return first === undefined ? null : { row: first, additionalCount: alerting.length - 1 }
}

/**
 * Filters (tab, then search), orders by carrier ETA and paginates the customer's rows for a URL
 * state. The order is fixed: the customer list has no sort control.
 */
export function buildCustomerShipmentListPage(
  rows: readonly ShipmentListRow[],
  query: CustomerShipmentsQuery,
): ShipmentListPage {
  const inTab = rows.filter(row => matchesCustomerTab(row, query.tab))
  const terms = splitSearchTerms(query.search)
  // Customers search id, PO and cities only: carrier and customer names are not theirs to find by.
  const matching = inTab.filter(row => terms.every(term => row.customerSearchText.includes(term)))

  return paginateShipmentRows(sortShipmentRows(matching, 'carrierEtaAsc'), query.page)
}
