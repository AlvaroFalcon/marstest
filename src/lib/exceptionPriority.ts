import { orderBy } from 'es-toolkit'
import type { ExceptionType, Shipment, ShipmentException } from '@/api/types'

/** An open exception together with the shipment it belongs to: one row of the ops inbox. */
export type ExceptionEntry = {
  shipment: Shipment
  exception: ShipmentException
}

/** Exception types from most to least urgent. */
const URGENCY_ORDER: readonly ExceptionType[] = [
  'customsHold',
  'incident',
  'vesselRolled',
  'predictedDelay',
  'staleTracking',
]

/** Position of an exception type in the urgency order; 0 is the most urgent. */
export function getExceptionUrgencyRank(type: ExceptionType): number {
  return URGENCY_ORDER.indexOf(type)
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
