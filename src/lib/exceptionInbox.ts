import type { Shipment, ShipmentException, Site } from '@/api/types'
import { listExceptionsByUrgency } from '@/lib/exceptionPriority'
import { getFreshness } from '@/lib/freshness'
import { classifyDelay } from '@/lib/delayClassification'
import { filterByOriginSite, scopeShipments } from '@/lib/scope'

/** One card of the ops inbox, with every value the card shows already resolved. */
export type ExceptionInboxItem = {
  shipmentId: string
  exception: ShipmentException
  /** Origin site city and destination city joined with an arrow, for example "Zaragoza → Hamburg". */
  routeLabel: string
  /** First sentence of the AI diagnosis: the one-line reason under the title. */
  reason: string
  /** Whole hours since the last tracking update, rounded down; 0 for a delivered shipment. */
  hoursSinceUpdate: number
}

/** Open exceptions of one in-scope site, for the site filter. */
export type SiteExceptionCount = {
  site: Site
  exceptionCount: number
}

/** Numbers of the KPI strip. */
export type ExceptionInboxKpis = {
  /** Open exceptions in view. */
  needAttention: number
  /** Undelivered shipments in view whose tracking has been silent for more than 24 h. */
  staleOver24h: number
  /** Shipments in view, delivered included, classified `onTrack`. */
  onTime: number
  /** Shipments in view: the denominator of "on time". */
  total: number
}

/** Everything the inbox screen shows, derived from the loaded lists. */
export type ExceptionInbox = {
  /** Cards of the selected site (all in-scope sites when none), most urgent first. */
  items: ExceptionInboxItem[]
  /** KPIs of the selected site; they follow the filter. */
  kpis: ExceptionInboxKpis
  /** Per-site counts of every in-scope site; never narrowed by the filter. */
  siteCounts: SiteExceptionCount[]
  /** Open exceptions across all in-scope sites; never narrowed by the filter. */
  totalExceptionCount: number
  /** Sites outside the ops scope, shown locked in the filter. */
  outOfScopeSites: Site[]
}

export type BuildExceptionInboxInput = {
  /** Shipments with at least one open exception, unscoped. */
  exceptionShipments: readonly Shipment[]
  /** Every shipment, unscoped. */
  shipments: readonly Shipment[]
  sites: readonly Site[]
  /** Selected origin site id, or `null` for all in-scope sites. */
  siteId: string | null
  /** Injected so freshness is deterministic. */
  now: Date
}

/**
 * Returns the first sentence of an AI summary. A sentence ends at `.`, `!` or `?` followed by
 * whitespace and a capital letter, so decimals ("8467.29") and abbreviations before lower-case
 * words do not split it.
 *
 * @example
 * getFirstSentence('Truck stopped at Basel. ETA unchanged.') // 'Truck stopped at Basel.'
 */
export function getFirstSentence(text: string): string {
  const [firstSentence = ''] = text.trim().split(/(?<=[.!?])\s+(?=\p{Lu})/u)
  return firstSentence
}

/** Builds "Origin city → Destination city"; falls back to the site id if the site is unknown. */
export function getRouteLabel(shipment: Shipment, sites: readonly Site[]): string {
  const originCity = sites.find(site => site.id === shipment.originSiteId)?.city ?? shipment.originSiteId
  return `${originCity} → ${shipment.destination.city}`
}

function toItem(shipment: Shipment, exception: ShipmentException, sites: readonly Site[], now: Date): ExceptionInboxItem {
  const freshness = getFreshness(shipment, now)
  return {
    shipmentId: shipment.id,
    exception,
    routeLabel: getRouteLabel(shipment, sites),
    reason: getFirstSentence(exception.aiDiagnosis.summary),
    hoursSinceUpdate: freshness.kind === 'notApplicable' ? 0 : Math.floor(freshness.hoursSinceUpdate),
  }
}

/**
 * Derives the ops exceptions inbox: cards, KPIs and filter counts. Cards and KPIs follow the
 * selected site; the per-site counts and the total do not, so the filter always shows where the
 * exceptions are. A site outside the ops scope yields an empty view and never leaks data.
 *
 * @example
 * buildExceptionInbox({ exceptionShipments, shipments, sites, siteId: 'bilbao-plant', now }).kpis
 */
export function buildExceptionInbox({ exceptionShipments, shipments, sites, siteId, now }: BuildExceptionInboxInput): ExceptionInbox {
  const ops = { role: 'ops' } as const
  const narrow = (list: Shipment[]) => (siteId === null ? list : filterByOriginSite(list, siteId))

  const scopedExceptionShipments = scopeShipments(exceptionShipments, ops, sites)
  const visibleExceptionShipments = narrow(scopedExceptionShipments)
  const visibleShipments = narrow(scopeShipments(shipments, ops, sites))

  const items = listExceptionsByUrgency(visibleExceptionShipments)
    .map(entry => toItem(entry.shipment, entry.exception, sites, now))

  const countExceptions = (list: readonly Shipment[]) =>
    list.reduce((total, shipment) => total + shipment.exceptions.length, 0)

  return {
    items,
    kpis: {
      needAttention: countExceptions(visibleExceptionShipments),
      staleOver24h: visibleShipments.filter(shipment => getFreshness(shipment, now).kind === 'stale').length,
      onTime: visibleShipments.filter(shipment => classifyDelay(shipment) === 'onTrack').length,
      total: visibleShipments.length,
    },
    siteCounts: sites
      .filter(site => site.inOpsScope)
      .map(site => ({
        site,
        exceptionCount: countExceptions(filterByOriginSite(scopedExceptionShipments, site.id)),
      })),
    totalExceptionCount: countExceptions(scopedExceptionShipments),
    outOfScopeSites: sites.filter(site => !site.inOpsScope),
  }
}
