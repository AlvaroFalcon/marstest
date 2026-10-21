import { maxBy } from 'es-toolkit'
import type { Shipment } from '@/api/types'
import { isDelivered } from '@/lib/shipmentStatus'
import { MILLISECONDS_PER_HOUR, STALE_AFTER_HOURS } from '@/lib/thresholds'

/**
 * How recent the tracking data of a shipment is. `notApplicable` is a delivered shipment: it will
 * never receive another update, so it is never stale.
 */
export type Freshness
  = | { kind: 'fresh', lastUpdateAt: string, hoursSinceUpdate: number }
    | { kind: 'stale', lastUpdateAt: string, hoursSinceUpdate: number }
    | { kind: 'notApplicable' }

/**
 * Classifies the tracking freshness from the most recent `receivedAt` among raw events and
 * milestones (when we learnt something, not when it happened). More than {@link STALE_AFTER_HOURS}
 * hours without news is stale; exactly that many is still fresh.
 *
 * @param now - Injected for deterministic tests.
 */
export function getFreshness(shipment: Shipment, now: Date): Freshness {
  if (isDelivered(shipment)) {
    return { kind: 'notApplicable' }
  }

  const receivedTimes = [
    ...shipment.rawEvents.map(rawEvent => Date.parse(rawEvent.receivedAt)),
    ...shipment.milestones.map(milestone => Date.parse(milestone.receivedAt)),
  ]
  // A shipment nobody has reported on yet is as old as its booking.
  const lastUpdateTime = maxBy(receivedTimes, time => time) ?? Date.parse(shipment.bookedAt)
  const hoursSinceUpdate = (now.getTime() - lastUpdateTime) / MILLISECONDS_PER_HOUR
  const lastUpdateAt = new Date(lastUpdateTime).toISOString()

  return {
    kind: hoursSinceUpdate > STALE_AFTER_HOURS ? 'stale' : 'fresh',
    lastUpdateAt,
    hoursSinceUpdate,
  }
}
