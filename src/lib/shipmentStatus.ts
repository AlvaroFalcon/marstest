import { orderBy } from 'es-toolkit'
import type { Milestone, MilestoneStatus, Shipment } from '@/api/types'

/** Current status of a shipment: the latest milestone, or `unknown` when none was reported yet. */
export type ShipmentStatus
  = | { kind: 'known', status: MilestoneStatus, milestone: Milestone }
    | { kind: 'unknown' }

/**
 * Derives the current status from the milestones instead of storing it, so it cannot drift when
 * a carrier event is simulated. The latest milestone by `occurredAt` wins; `receivedAt` breaks ties.
 */
export function getShipmentStatus(shipment: Shipment): ShipmentStatus {
  const [latest] = orderBy(
    shipment.milestones,
    [milestone => Date.parse(milestone.occurredAt), milestone => Date.parse(milestone.receivedAt)],
    ['desc', 'desc'],
  )
  return latest ? { kind: 'known', status: latest.status, milestone: latest } : { kind: 'unknown' }
}

/** True when the latest milestone is the delivery. */
export function isDelivered(shipment: Shipment): boolean {
  const status = getShipmentStatus(shipment)
  return status.kind === 'known' && status.status === 'delivered'
}
