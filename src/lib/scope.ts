import type { Shipment, Site } from '@/api/types'

/** Who is looking: the operations user (Spain sites) or one customer. */
export type Viewer
  = | { role: 'ops' }
    | { role: 'customer', customerId: string }

/**
 * Keeps the shipments the viewer may see. Ops see the shipments of the sites flagged `inOpsScope`
 * (inbox and all-shipments list alike); a customer sees every shipment with their `customerId`,
 * including the ones shipped from the out-of-scope site.
 */
export function scopeShipments(shipments: readonly Shipment[], viewer: Viewer, sites: readonly Site[]): Shipment[] {
  if (viewer.role === 'customer') {
    return shipments.filter(shipment => shipment.customerId === viewer.customerId)
  }

  const opsSiteIds = new Set(sites.filter(site => site.inOpsScope).map(site => site.id))
  return shipments.filter(shipment => opsSiteIds.has(shipment.originSiteId))
}

/**
 * Narrows already scoped shipments to one origin site (the `?site=` filter). Apply it after
 * {@link scopeShipments} so a site outside the ops scope yields no shipments instead of leaking them.
 */
export function filterByOriginSite(shipments: readonly Shipment[], siteId: string): Shipment[] {
  return shipments.filter(shipment => shipment.originSiteId === siteId)
}
