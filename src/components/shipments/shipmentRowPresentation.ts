import type { IntlShape } from 'react-intl'
import {
  formatElapsedTime,
  formatEstimateRange,
  formatUtcDay,
} from '@/components/provenance/formatProvenance'
import { getElapsedTime, getEstimateRangeShape } from '@/lib/provenance'
import type { ShipmentListRow } from '@/lib/shipmentList'
import routes from '@/routes'

/**
 * Where a row leads: the exception detail when the shipment has an open exception (that is where
 * ops can act), otherwise the shipment detail.
 */
export function getShipmentRowHref(row: ShipmentListRow): string {
  return row.hasOpenException ? routes.ops.exception(row.id) : routes.ops.shipment(row.id)
}

/** "Zaragoza → Hamburg". */
export function formatShipmentRoute(intl: IntlShape, row: ShipmentListRow): string {
  return intl.formatMessage({ id: 'shipmentList.route' }, { origin: row.originCity, destination: row.destinationCity })
}

/** Carriers of the journey joined by " · ". */
export function formatShipmentCarriers(row: ShipmentListRow): string {
  return row.carrierNames.join(' · ')
}

/**
 * Latest milestone as "Status · location"; a delivered shipment reads "Delivered Oct 17" with
 * " · POD available" when the proof of delivery is on file.
 */
export function formatShipmentMilestone(intl: IntlShape, row: ShipmentListRow): string {
  const { latestMilestone } = row
  if (latestMilestone === null) {
    return intl.formatMessage({ id: 'shipmentList.milestone.none' })
  }
  if (row.status === 'delivered') {
    return intl.formatMessage(
      { id: row.hasProofOfDelivery ? 'shipmentList.deliveredWithProof' : 'shipmentList.delivered' },
      { date: formatUtcDay(intl, latestMilestone.occurredAt) },
    )
  }
  return intl.formatMessage(
    { id: 'shipmentList.milestone' },
    { status: intl.formatMessage({ id: `journey.status.${latestMilestone.status}` }), location: latestMilestone.location },
  )
}

/** Carrier ETA day, "Not provided", or the delivery day for a delivered shipment. */
export function formatShipmentCarrierEta(intl: IntlShape, row: ShipmentListRow): string {
  if (row.status === 'delivered' && row.latestMilestone !== null) {
    return intl.formatMessage({ id: 'shipmentList.delivered' }, { date: formatUtcDay(intl, row.latestMilestone.occurredAt) })
  }
  if (row.carrierEta.status === 'notProvided') {
    return intl.formatMessage({ id: 'shipmentList.carrierEta.notProvided' })
  }
  return formatUtcDay(intl, row.carrierEta.date)
}

/** Our estimate window ("Oct 24–25"), or `null` for a delivered shipment, which has nothing left to estimate. */
export function formatShipmentEstimate(intl: IntlShape, row: ShipmentListRow): string | null {
  if (row.status === 'delivered') {
    return null
  }
  return formatEstimateRange(intl, row.estimatedEta, getEstimateRangeShape(row.estimatedEta))
}

/** Last update as "2 h ago", or `null` when the shipment is delivered ("Final"). */
export function formatShipmentUpdated(intl: IntlShape, row: ShipmentListRow, now: Date): string | null {
  if (row.freshness.kind === 'notApplicable') {
    return null
  }
  return formatElapsedTime(intl, getElapsedTime(row.freshness.lastUpdateAt, now))
}
