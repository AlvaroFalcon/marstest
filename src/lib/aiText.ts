import type { Customer, DocumentType, ExceptionType, Shipment } from '@/api/types'
import { classifyDelay } from '@/lib/delayClassification'
import { checkDocuments } from '@/lib/documentCheck'
import type { DocumentFinding } from '@/lib/documentCheck'
import { listExceptionsByUrgency } from '@/lib/exceptionPriority'
import { getShipmentStatus } from '@/lib/shipmentStatus'
import { STALE_AFTER_HOURS } from '@/lib/thresholds'

/**
 * Simulated AI texts for content the seed does not already hold: the suggested next action and
 * the customer notice of exceptions created later (for example by the simulated carrier event). Seeded explanations are never regenerated. Every sentence is built
 * only from values present in the shipment, so the texts cannot invent dates or numbers.
 */

const EXCEPTION_PHRASES: Record<ExceptionType, string> = {
  customsHold: 'is held at customs',
  vesselRolled: 'was not loaded on its vessel and moves to the next sailing',
  predictedDelay: 'is expected to arrive later than the carrier ETA',
  staleTracking: `has had no tracking update for more than ${STALE_AFTER_HOURS} hours`,
  incident: 'was affected by an incident on its way',
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

const listFormatter = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' })

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}

const FIELD_LABELS: Record<'hsCode' | 'grossWeightKg', string> = {
  hsCode: 'HS code',
  grossWeightKg: 'gross weight',
}

/** Wording of one document finding as a step to release a customs hold; `null` for findings that need no step. */
function describeCustomsStep(finding: DocumentFinding): string | null {
  if (finding.kind !== 'mismatch') {
    return null
  }
  const unit = finding.field === 'grossWeightKg' ? ' kg' : ''
  return `correct the ${FIELD_LABELS[finding.field]} on the ${DOCUMENT_LABELS[finding.documentType]} (${finding.actual}${unit} vs ${finding.expected}${unit} in the ERP order)`
}

function suggestActionForException(shipment: Shipment, type: ExceptionType): string {
  switch (type) {
    case 'customsHold': {
      const { findings } = checkDocuments(shipment)
      const missingLabels = findings.flatMap(finding => finding.kind === 'missing' ? [DOCUMENT_LABELS[finding.documentType]] : [])
      const steps = [
        ...(missingLabels.length > 0 ? [`provide the missing ${listFormatter.format(missingLabels)}`] : []),
        ...findings.flatMap((finding) => {
          const step = describeCustomsStep(finding)
          return step === null ? [] : [step]
        }),
      ]
      return steps.length > 0
        ? `To release the customs hold, ${listFormatter.format(steps)}.`
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
      return 'Review the new estimate and send the customer notice.'
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
