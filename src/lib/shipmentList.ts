import { orderBy, uniq } from 'es-toolkit'
import type { CarrierEta, EstimatedEta, MilestoneStatus, ReferenceData, Shipment } from '@/api/types'
import { compareEta } from '@/lib/eta'
import { classifyDelay } from '@/lib/delayClassification'
import { getFreshness, type Freshness } from '@/lib/freshness'
import { scopeShipments } from '@/lib/scope'
import { getShipmentStatus, isDelivered } from '@/lib/shipmentStatus'

/** Rows per page of the ops "All shipments" list. */
export const SHIPMENTS_PAGE_SIZE = 8

/**
 * The single status each shipment of the list shows, in the order the filter offers them. A
 * shipment has exactly one: see {@link getShipmentListStatus} for the precedence.
 */
export const SHIPMENT_LIST_STATUSES = ['atRisk', 'stale', 'onTime', 'scheduled', 'delivered'] as const

/** @see SHIPMENT_LIST_STATUSES */
export type ShipmentListStatus = typeof SHIPMENT_LIST_STATUSES[number]

/**
 * Sort orders offered by the list. The string is also the value stored in the URL, so a link
 * restores the same order.
 */
export const SHIPMENT_SORTS = ['carrierEtaAsc', 'carrierEtaDesc', 'confidenceAsc', 'confidenceDesc'] as const

/** @see SHIPMENT_SORTS */
export type ShipmentSort = typeof SHIPMENT_SORTS[number]

/** Order of the list when the URL names none; never written to the URL. */
export const DEFAULT_SHIPMENT_SORT: ShipmentSort = 'carrierEtaAsc'

/** Columns the list can be sorted by. */
export type ShipmentSortColumn = 'carrierEta' | 'confidence'

/** Direction of a sorted column, as announced through `aria-sort`. */
export type ShipmentSortDirection = 'asc' | 'desc'

/**
 * Everything a list row (table row or card) shows or filters by, resolved from the domain model.
 * Holds no display strings: formatting belongs to the components.
 */
export type ShipmentListRow = {
  id: string
  originSiteId: string
  customerName: string
  originCity: string
  destinationCity: string
  /** Distinct carriers of the legs, in journey order. */
  carrierNames: string[]
  /** Latest confirmed milestone; `null` when nobody has reported on the shipment yet. */
  latestMilestone: { status: MilestoneStatus, location: string, occurredAt: string } | null
  hasProofOfDelivery: boolean
  status: ShipmentListStatus
  carrierEta: CarrierEta
  estimatedEta: EstimatedEta
  /** True when our estimate differs from the carrier ETA beyond the tolerance. */
  isEstimateDeviating: boolean
  /** Confidence of our estimate; `null` once delivered, when there is nothing left to estimate. */
  confidence: number | null
  freshness: Freshness
  hasOpenException: boolean
  /** Lower-cased shipment id, customer, PO, carriers and origin/destination cities, joined for search. */
  searchText: string
}

/** Criteria that narrow, order and slice the list; this is the state held in the URL. */
export type ShipmentListQuery = {
  /** Origin site id, or `null` for all my sites. */
  siteId: string | null
  /** Status to keep, or `null` for any. */
  status: ShipmentListStatus | null
  /** Free text; empty means no search. */
  search: string
  sort: ShipmentSort
  /** One-based page; values past the last page are clamped. */
  page: number
}

/** One page of the list plus the numbers the footer needs. */
export type ShipmentListPage = {
  rows: ShipmentListRow[]
  /** The page actually shown, after clamping. */
  page: number
  pageCount: number
  /** Rows matching the filters across all pages ("M" in "Showing N of M"). */
  totalCount: number
}

/**
 * Derives the one status of a shipment. Precedence, highest first: delivered; at risk (an open
 * exception other than stale tracking, or a predicted delay at or above the confidence
 * threshold); no recent update (stale tracking); scheduled (not picked up yet); otherwise on time.
 * Stale tracking ranks below at risk so a customs hold that has also gone quiet is still shown as
 * at risk, and an exception that only says "no news" shows as no recent update. A shipment that
 * is only "watching" (deviating with low confidence) is still on time: it is not alerted, and its
 * confidence stays visible in the row.
 */
export function getShipmentListStatus(shipment: Shipment, now: Date): ShipmentListStatus {
  if (isDelivered(shipment)) {
    return 'delivered'
  }
  const hasRiskException = shipment.exceptions.some(exception => exception.type !== 'staleTracking')
  if (hasRiskException || classifyDelay(shipment) === 'predictedDelay') {
    return 'atRisk'
  }
  if (getFreshness(shipment, now).kind === 'stale' || shipment.exceptions.length > 0) {
    return 'stale'
  }
  const latest = getShipmentStatus(shipment)
  if (latest.kind === 'unknown' || latest.status === 'booked') {
    return 'scheduled'
  }
  return 'onTime'
}

/**
 * Builds the rows of the ops list: only shipments from the ops sites (delivered ones included),
 * with ids resolved to names. Order is the order of `shipments`.
 */
export function buildShipmentRows(
  shipments: readonly Shipment[],
  referenceData: ReferenceData,
  now: Date,
): ShipmentListRow[] {
  return scopeShipments(shipments, { role: 'ops' }, referenceData.sites).map((shipment) => {
    const customerName = referenceData.customers.find(customer => customer.id === shipment.customerId)?.name
      ?? shipment.customerId
    const originCity = referenceData.sites.find(site => site.id === shipment.originSiteId)?.city
      ?? shipment.originSiteId
    const carrierNames = uniq(shipment.legs.map(leg =>
      referenceData.carriers.find(carrier => carrier.id === leg.carrierId)?.name ?? leg.carrierId,
    ))
    const status = getShipmentStatus(shipment)
    const latestMilestone = status.kind === 'known'
      ? { status: status.status, location: status.milestone.location, occurredAt: status.milestone.occurredAt }
      : null
    const listStatus = getShipmentListStatus(shipment, now)

    return {
      id: shipment.id,
      originSiteId: shipment.originSiteId,
      customerName,
      originCity,
      destinationCity: shipment.destination.city,
      carrierNames,
      latestMilestone,
      hasProofOfDelivery: shipment.documents.some(document =>
        document.type === 'proofOfDelivery' && document.status === 'received'),
      status: listStatus,
      carrierEta: shipment.carrierEta,
      estimatedEta: shipment.estimatedEta,
      isEstimateDeviating: compareEta(shipment.carrierEta, shipment.estimatedEta).kind === 'deviates',
      confidence: listStatus === 'delivered' ? null : shipment.estimatedEta.confidence,
      freshness: getFreshness(shipment, now),
      hasOpenException: shipment.exceptions.length > 0,
      searchText: [
        shipment.id,
        customerName,
        shipment.erpOrder.poNumber,
        ...carrierNames,
        originCity,
        shipment.destination.city,
      ].join(' ').toLowerCase(),
    }
  })
}

/**
 * Keeps the rows that match every whitespace-separated term of the search (case-insensitive,
 * substring) and, when given, the site and the status.
 */
export function filterShipmentRows(
  rows: readonly ShipmentListRow[],
  { siteId, status, search }: Pick<ShipmentListQuery, 'siteId' | 'status' | 'search'>,
): ShipmentListRow[] {
  const terms = search.toLowerCase().split(/\s+/).filter(term => term !== '')

  return rows.filter(row =>
    (siteId === null || row.originSiteId === siteId)
    && (status === null || row.status === status)
    && terms.every(term => row.searchText.includes(term)),
  )
}

/** Splits a sort into the column and direction the header shows. */
export function getSortState(sort: ShipmentSort): { column: ShipmentSortColumn, direction: ShipmentSortDirection } {
  switch (sort) {
    case 'carrierEtaAsc':
      return { column: 'carrierEta', direction: 'asc' }
    case 'carrierEtaDesc':
      return { column: 'carrierEta', direction: 'desc' }
    case 'confidenceAsc':
      return { column: 'confidence', direction: 'asc' }
    case 'confidenceDesc':
      return { column: 'confidence', direction: 'desc' }
  }
}

/**
 * The sort a click on a column header leads to. Carrier ETA cycles ascending, descending, back to
 * the default (which is ascending ETA); confidence starts with the highest first, then lowest
 * first, then returns to the default.
 */
export function getNextSort(current: ShipmentSort, column: ShipmentSortColumn): ShipmentSort {
  if (column === 'carrierEta') {
    return current === 'carrierEtaAsc' ? 'carrierEtaDesc' : DEFAULT_SHIPMENT_SORT
  }
  switch (current) {
    case 'confidenceDesc':
      return 'confidenceAsc'
    case 'confidenceAsc':
      return DEFAULT_SHIPMENT_SORT
    default:
      return 'confidenceDesc'
  }
}

function getSortValue(row: ShipmentListRow, column: ShipmentSortColumn): number | null {
  if (column === 'confidence') {
    return row.confidence
  }
  // A delivered shipment shows its delivery date in that column, not an ETA to compare.
  return row.status !== 'delivered' && row.carrierEta.status === 'provided' ? Date.parse(row.carrierEta.date) : null
}

/**
 * Orders the rows. Rows with no value for the column (no carrier ETA, delivered) always go last,
 * in either direction, because they cannot be compared; ties break by shipment id so the order is
 * stable between renders.
 */
export function sortShipmentRows(rows: readonly ShipmentListRow[], sort: ShipmentSort): ShipmentListRow[] {
  const { column, direction } = getSortState(sort)
  const comparable = rows.filter(row => getSortValue(row, column) !== null)
  const incomparable = rows.filter(row => getSortValue(row, column) === null)

  return [
    ...orderBy(comparable, [row => getSortValue(row, column), row => row.id], [direction, 'asc']),
    ...orderBy(incomparable, [row => row.id], ['asc']),
  ]
}

/** Slices one page. A page past the end (or below 1) is clamped, and there is always at least one page. */
export function paginateShipmentRows(
  rows: readonly ShipmentListRow[],
  page: number,
  pageSize: number = SHIPMENTS_PAGE_SIZE,
): ShipmentListPage {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const clampedPage = Math.min(Math.max(1, page), pageCount)
  const start = (clampedPage - 1) * pageSize

  return {
    rows: rows.slice(start, start + pageSize),
    page: clampedPage,
    pageCount,
    totalCount: rows.length,
  }
}

/**
 * Filters, sorts and paginates the rows for a URL state.
 *
 * @example
 * buildShipmentListPage(rows, { siteId: null, status: 'atRisk', search: '', sort: 'carrierEtaAsc', page: 1 })
 */
export function buildShipmentListPage(rows: readonly ShipmentListRow[], query: ShipmentListQuery): ShipmentListPage {
  return paginateShipmentRows(sortShipmentRows(filterShipmentRows(rows, query), query.sort), query.page)
}

/** Number of rows from one origin site, for the site filter; computed on unfiltered rows so the counts never move with the other filters. */
export function countRowsBySite(rows: readonly ShipmentListRow[], siteId: string): number {
  return rows.filter(row => row.originSiteId === siteId).length
}
