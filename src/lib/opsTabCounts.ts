import type { Shipment, Site } from '@/api/types'
import { scopeShipments } from '@/lib/scope'

/** Count shown next to a tab: never `null`, so each state is handled explicitly. */
export type OpsTabCount
  = | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready', value: number }

/** Load state of one input of the counts, independent of the data-fetching library. */
export type OpsTabCountSource<Data>
  = | { status: 'pending' }
    | { status: 'error' }
    | { status: 'success', data: Data }

export type OpsTabCountsInput = {
  sites: OpsTabCountSource<readonly Site[]>
  /** Shipments that have at least one open exception. */
  exceptions: OpsTabCountSource<readonly Shipment[]>
  shipments: OpsTabCountSource<readonly Shipment[]>
}

export type OpsTabCounts = {
  exceptionCount: OpsTabCount
  shipmentCount: OpsTabCount
}

/**
 * Computes the ops tab counts: open exceptions and shipments in the ops scope (sites flagged
 * `inOpsScope`). The inbox `?site=` filter is deliberately not an input, so the counts never
 * change with it. A count is `ready` only when the sites and its own list are loaded: any error
 * wins over a pending input, so a wrong number is never shown.
 *
 * @example
 * countOpsTabs({ sites, exceptions, shipments }).exceptionCount // { status: 'ready', value: 5 }
 */
export function countOpsTabs({ sites, exceptions, shipments }: OpsTabCountsInput): OpsTabCounts {
  return {
    exceptionCount: toTabCount(sites, exceptions, (siteList, list) =>
      scopeShipments(list, { role: 'ops' }, siteList)
        .reduce((total, shipment) => total + shipment.exceptions.length, 0)),
    shipmentCount: toTabCount(sites, shipments, (siteList, list) =>
      scopeShipments(list, { role: 'ops' }, siteList).length),
  }
}

function toTabCount<Data>(
  sites: OpsTabCountSource<readonly Site[]>,
  list: OpsTabCountSource<Data>,
  count: (siteList: readonly Site[], data: Data) => number,
): OpsTabCount {
  if (sites.status === 'error' || list.status === 'error') {
    return { status: 'error' }
  }
  if (sites.status === 'pending' || list.status === 'pending') {
    return { status: 'loading' }
  }
  return { status: 'ready', value: count(sites.data, list.data) }
}
