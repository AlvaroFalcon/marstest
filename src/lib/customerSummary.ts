import type { Shipment } from '@/api/types'

/** Customer-facing summary of a shipment plus the number of carrier events it is based on. */
export type CustomerShipmentSummary = {
  text: string
  /** Raw carrier events of the shipment: the "Based on N carrier events" label. */
  eventCount: number
}

/**
 * Simulated AI summary written for the customer. The text is hand-written per shipment in the
 * seed (and rewritten by the simulated carrier event) because sentences assembled from milestones
 * read like a template; seed tests check that it quotes the same days as the estimate.
 */
export function summarizeShipmentForCustomer(shipment: Shipment): CustomerShipmentSummary {
  return { text: shipment.customerSummary, eventCount: shipment.rawEvents.length }
}
