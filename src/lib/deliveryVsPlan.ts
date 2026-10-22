import { MILLISECONDS_PER_HOUR } from '@/lib/thresholds'
import type { Shipment } from '@/api/types'
import { getShipmentStatus } from '@/lib/shipmentStatus'

/** A whole number of days (from 24 h on) or of hours (below that). */
export type DeliveryDuration = {
  unit: 'day' | 'hour'
  count: number
}

/**
 * How the real delivery compares with the date planned at dispatch. `notDelivered` means there is
 * nothing to compare yet.
 */
export type DeliveryVsPlan
  = | { kind: 'notDelivered' }
    | { kind: 'onTime' }
    | { kind: 'early', duration: DeliveryDuration }
    | { kind: 'late', duration: DeliveryDuration }

/** A delivery within this many hours of the plan (inclusive, either side) counts as on time. */
const ON_TIME_TOLERANCE_HOURS = 1

const HOURS_PER_DAY = 24

/**
 * Compares the delivery milestone with `plannedDeliveryAt`, the date planned at dispatch. The
 * carrier ETA and our estimate are deliberately not the baseline: the customer judges the delivery
 * against what was promised first.
 *
 * The gap is worded in whole days from 24 h on (rounded to the nearest day) and in whole hours
 * below that.
 *
 * @example
 * getDeliveryVsPlan(deliveredOneDayAheadShipment) // { kind: 'early', duration: { unit: 'day', count: 1 } }
 */
export function getDeliveryVsPlan(shipment: Shipment): DeliveryVsPlan {
  const status = getShipmentStatus(shipment)
  if (status.kind !== 'known' || status.status !== 'delivered') {
    return { kind: 'notDelivered' }
  }

  const gapHours = (Date.parse(status.milestone.occurredAt) - Date.parse(shipment.plannedDeliveryAt)) / MILLISECONDS_PER_HOUR
  const absoluteGapHours = Math.abs(gapHours)
  if (absoluteGapHours <= ON_TIME_TOLERANCE_HOURS) {
    return { kind: 'onTime' }
  }

  const duration: DeliveryDuration = absoluteGapHours >= HOURS_PER_DAY
    ? { unit: 'day', count: Math.round(absoluteGapHours / HOURS_PER_DAY) }
    : { unit: 'hour', count: Math.round(absoluteGapHours) }

  return { kind: gapHours < 0 ? 'early' : 'late', duration }
}
