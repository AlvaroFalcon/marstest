import { orderBy } from 'es-toolkit'
import type { ExceptionType, Shipment, ShipmentException } from '@/api/types'

/** An open exception together with the shipment it belongs to: one row of the ops inbox. */
export type ExceptionEntry = {
  shipment: Shipment
  exception: ShipmentException
}

/** Urgency rank per exception type; 0 is the most urgent. Exhaustive, so a new type must be ranked. */
const URGENCY_RANK: Record<ExceptionType, number> = {
  customsHold: 0,
  incident: 1,
  vesselRolled: 2,
  predictedDelay: 3,
  staleTracking: 4,
}

/** Position of an exception type in the urgency order; 0 is the most urgent. */
export function getExceptionUrgencyRank(type: ExceptionType): number {
  return URGENCY_RANK[type]
}

/**
 * Flattens the open exceptions of the given shipments and orders them for the inbox: by type
 * urgency, then oldest `openedAt` first (waiting longest), then shipment id so the order is stable.
 */
export function listExceptionsByUrgency(shipments: readonly Shipment[]): ExceptionEntry[] {
  const entries = shipments.flatMap(shipment => shipment.exceptions.map(exception => ({ shipment, exception })))
  return orderBy(
    entries,
    [
      entry => getExceptionUrgencyRank(entry.exception.type),
      entry => Date.parse(entry.exception.openedAt),
      entry => entry.shipment.id,
    ],
    ['asc', 'asc', 'asc'],
  )
}
