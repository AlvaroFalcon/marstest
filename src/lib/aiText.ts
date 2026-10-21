import type { Customer, DocumentType, ExceptionType, MilestoneStatus, Shipment } from '@/api/types'
import { classifyDelay } from '@/lib/delayClassification'
import { checkDocuments } from '@/lib/documentCheck'
import { listExceptionsByUrgency } from '@/lib/exceptionPriority'
import { getShipmentStatus } from '@/lib/shipmentStatus'

/**
 * Simulated AI texts for content the seed does not already hold: the customer summary, the
 * suggested next action and the customer notice of exceptions created later (for example by the
 * simulated carrier event). Seeded explanations are never regenerated. Every sentence is built
 * only from values present in the shipment, so the texts cannot invent dates or numbers.
 */

/** Customer-facing summary of a shipment plus the events it is based on ("Based on N events"). */
export type ShipmentSummary = {
  text: string
  basedOnEventIds: string[]
  basedOnEventCount: number
}

/** Predicate that follows "Shipment SH-1000" and reads naturally with the milestone location. */
const STATUS_PREDICATES: Record<MilestoneStatus, (location: string) => string> = {
  booked: location => `was booked at ${location}`,
  pickedUp: location => `was picked up at ${location}`,
  departed: location => `departed from ${location}`,
  // Seed locations are positions such as "A-2 near Lleida" or "Bay of Biscay", so they follow a label, not a preposition.
  inTransit: location => `is in transit; last reported position: ${location}`,
  arrived: location => `arrived at ${location}`,
  loadedOnVessel: location => `was loaded on the vessel at ${location}`,
  vesselRolled: location => `was not loaded on its vessel at ${location} and moves to the next sailing`,
  customsHold: location => `is held at customs at ${location}`,
  customsCleared: location => `was cleared by customs at ${location}`,
  delayed: location => `is delayed at ${location}`,
  incident: location => `was affected by an incident at ${location}`,
  outForDelivery: location => `is out for delivery in ${location}`,
  delivered: location => `was delivered to ${location}`,
}

const EXCEPTION_PHRASES: Record<ExceptionType, string> = {
  customsHold: 'is held at customs',
  vesselRolled: 'was not loaded on its vessel and moves to the next sailing',
  predictedDelay: 'is expected to arrive later than the carrier ETA',
  staleTracking: 'has had no tracking update for more than 24 hours',
  incident: 'was affected by an incident on the road',
}

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  commercialInvoice: 'commercial invoice',
  packingList: 'packing list',
  billOfLading: 'bill of lading',
  cmr: 'CMR',
  certificateOfOrigin: 'certificate of origin',
  customsDeclaration: 'customs declaration',
  proofOfDelivery: 'proof of delivery',
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

/**
 * Summarises where a shipment is for the customer: current status and location, our estimate
 * with its confidence, and the open exception if there is one.
 *
 * @returns The text and the raw events it is based on, for the "Based on N events" label.
 */
export function summarizeShipmentForCustomer(shipment: Shipment): ShipmentSummary {
  const status = getShipmentStatus(shipment)
  const sentences: string[] = []

  if (status.kind === 'known') {
    sentences.push(`Shipment ${shipment.id} ${STATUS_PREDICATES[status.status](status.milestone.location)}.`)
  }
  else {
    sentences.push(`Shipment ${shipment.id} has no tracking update yet.`)
  }

  if (status.kind === 'known' && status.status === 'delivered') {
    sentences.push(`It was delivered on ${formatDate(status.milestone.occurredAt)}.`)
  }
  else {
    const { date, confidence } = shipment.estimatedEta
    sentences.push(`We estimate delivery on ${formatDate(date)} (${confidence} % confidence).`)
  }

  const [openException] = listExceptionsByUrgency([shipment])
  if (openException) {
    sentences.push(`Open issue: this shipment ${EXCEPTION_PHRASES[openException.exception.type]}.`)
  }

  const basedOnEventIds = shipment.rawEvents.map(rawEvent => rawEvent.id)
  return { text: sentences.join(' '), basedOnEventIds, basedOnEventCount: basedOnEventIds.length }
}

function suggestActionForException(shipment: Shipment, type: ExceptionType): string {
  switch (type) {
    case 'customsHold': {
      const missing = checkDocuments(shipment).findings.flatMap(finding => finding.kind === 'missing' ? [DOCUMENT_LABELS[finding.documentType]] : [])
      return missing.length > 0
        ? `Provide the missing ${missing.join(' and ')} to release the customs hold.`
        : 'Ask the customs broker what the authority is waiting for.'
    }
    case 'vesselRolled':
      return 'Confirm the new sailing with the carrier and send the customer notice.'
    case 'predictedDelay':
      return 'Review the new estimate and send the customer notice.'
    case 'staleTracking':
      return 'Ask the carrier for a status update.'
    case 'incident':
      return 'Ask the carrier for a revised ETA and the condition of the cargo.'
  }
}

/**
 * Suggests the next step for ops. An open exception takes priority (the most urgent one when
 * there are several); otherwise the suggestion follows the delay class, where "watching" gets the
 * low-cost step of ADR 0027.
 */
export function suggestNextAction(shipment: Shipment): string {
  const [openException] = listExceptionsByUrgency([shipment])
  if (openException) {
    return suggestActionForException(shipment, openException.exception.type)
  }

  switch (classifyDelay(shipment)) {
    case 'onTrack':
      return 'No action needed.'
    case 'watching':
      return 'Ask the carrier to confirm the ETA.'
    case 'predictedDelay':
      return 'Review the new estimate and notify the customer.'
  }
}

/** Input of {@link draftCustomerNotice}. */
export type DraftCustomerNoticeInput = {
  shipment: Shipment
  customer: Customer
  exceptionType: ExceptionType
}

/**
 * Drafts the body of a customer notice for an exception created after the seed (the seeded
 * exceptions already carry their draft). The text states what happened and our current estimate;
 * ops review it before anything is sent.
 */
export function draftCustomerNotice({ shipment, customer, exceptionType }: DraftCustomerNoticeInput): string {
  const status = getShipmentStatus(shipment)
  const sentences = [
    `Hello ${customer.name} team,`,
    `shipment ${shipment.id} (PO ${shipment.erpOrder.poNumber}) ${EXCEPTION_PHRASES[exceptionType]}.`,
  ]
  if (status.kind === 'known') {
    sentences.push(`Last reported location: ${status.milestone.location}.`)
  }
  sentences.push(`We now expect delivery on ${formatDate(shipment.estimatedEta.date)}.`)

  return sentences.join(' ')
}
