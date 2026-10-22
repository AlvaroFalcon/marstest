import type { CarrierChannel, ReferenceData, Shipment } from '@/api/types'
import { buildCustomerDocumentRows, type CustomerDocumentRow } from '@/lib/customerDocuments'
import { summarizeShipmentForCustomer, type CustomerShipmentSummary } from '@/lib/customerSummary'
import { getDeliveryVsPlan, type DeliveryVsPlan } from '@/lib/deliveryVsPlan'
import { getRouteLabel } from '@/lib/exceptionInbox'
import { getFreshness, type Freshness } from '@/lib/freshness'
import { getShipmentListStatus, type ShipmentListStatus } from '@/lib/shipmentList'
import { getShipmentStatus } from '@/lib/shipmentStatus'

/**
 * How current the header says the tracking is. A delivered shipment is `final` and will not change;
 * every other one carries the real freshness, so a quiet shipment reads "No update for X h".
 */
export type CustomerFreshness
  = | { kind: 'tracking', freshness: Exclude<Freshness, { kind: 'notApplicable' }> }
    | { kind: 'final' }

/** Where a carrier message came from, for the "Source: Transauto API" note. */
export type CustomerEventSource = {
  carrierName: string
  channel: CarrierChannel
}

/**
 * The arrival card of the detail. In transit the ETA pair applies; once delivered the card shows
 * the delivery against the plan made at dispatch.
 */
export type CustomerArrival
  = | {
    kind: 'inTransit'
    /** Carrier that reported the carrier ETA, or the carrier of the last leg when it gave none. */
    etaCarrierName: string
  }
  | {
    kind: 'delivered'
    deliveredAt: string
    plannedDeliveryAt: string
    deliveryVsPlan: Exclude<DeliveryVsPlan, { kind: 'notDelivered' }>
    /** Carrier and channel of the delivery message; `null` when the delivery has no raw event. */
    source: CustomerEventSource | null
    /** True when the signed proof of delivery was received ("proof of delivery signed"). */
    hasSignedProofOfDelivery: boolean
  }

/**
 * Everything the customer shipment detail shows that is not read straight from the shipment,
 * resolved so the components only render it. Internal data (diagnosis, document check, drafts,
 * ERP values, customer, site) is not part of it on purpose: the model is the customer-safe view.
 */
export type CustomerShipmentDetailModel = {
  shipmentId: string
  /** "Zaragoza → Hamburg". */
  routeLabel: string
  status: ShipmentListStatus
  freshness: CustomerFreshness
  summary: CustomerShipmentSummary
  arrival: CustomerArrival
  documents: CustomerDocumentRow[]
  /** Carrier display names by id, for the journey connectors ("Road · Transauto"). */
  carrierNames: Record<string, string>
}

function getCarrierName(referenceData: ReferenceData, carrierId: string): string {
  return referenceData.carriers.find(carrier => carrier.id === carrierId)?.name ?? carrierId
}

function buildArrival(shipment: Shipment, referenceData: ReferenceData): CustomerArrival {
  const status = getShipmentStatus(shipment)
  const deliveryVsPlan = getDeliveryVsPlan(shipment)

  if (status.kind === 'known' && status.status === 'delivered' && deliveryVsPlan.kind !== 'notDelivered') {
    const rawEventIds = status.milestone.source === 'carrier' ? status.milestone.rawEventIds : []
    const deliveryEvent = shipment.rawEvents.find(rawEvent => rawEventIds.includes(rawEvent.id))

    return {
      kind: 'delivered',
      deliveredAt: status.milestone.occurredAt,
      plannedDeliveryAt: shipment.plannedDeliveryAt,
      deliveryVsPlan,
      source: deliveryEvent === undefined
        ? null
        : { carrierName: getCarrierName(referenceData, deliveryEvent.carrierId), channel: deliveryEvent.channel },
      hasSignedProofOfDelivery: shipment.documents.some(document =>
        document.type === 'proofOfDelivery' && document.status === 'received'),
    }
  }

  const etaCarrierId = shipment.carrierEta.status === 'provided'
    ? shipment.carrierEta.source.carrierId
    : shipment.legs.at(-1)?.carrierId
  return { kind: 'inTransit', etaCarrierName: etaCarrierId === undefined ? '' : getCarrierName(referenceData, etaCarrierId) }
}

/**
 * Builds the customer-safe view of a shipment the customer owns. Carrier names are shown to
 * customers on purpose (journey connectors and sources); nothing internal is read.
 *
 * @param now - Injected for deterministic tests; decides the freshness and the status.
 */
export function buildCustomerShipmentDetail(
  shipment: Shipment,
  referenceData: ReferenceData,
  now: Date,
): CustomerShipmentDetailModel {
  const freshness = getFreshness(shipment, now)
  const originCity = referenceData.sites.find(site => site.id === shipment.originSiteId)?.city ?? shipment.originSiteId

  return {
    shipmentId: shipment.id,
    routeLabel: getRouteLabel(shipment, referenceData.sites),
    status: getShipmentListStatus(shipment, now),
    freshness: freshness.kind === 'notApplicable'
      ? { kind: 'final' }
      : { kind: 'tracking', freshness },
    summary: summarizeShipmentForCustomer({ shipment, originCity }),
    arrival: buildArrival(shipment, referenceData),
    documents: buildCustomerDocumentRows(shipment),
    carrierNames: Object.fromEntries(referenceData.carriers.map(carrier => [carrier.id, carrier.name])),
  }
}
