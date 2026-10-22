import type { DocumentType, Shipment } from '@/api/types'
import { isDelivered } from '@/lib/shipmentStatus'

/**
 * Documents a customer may see, in display order. It is an allow-list on purpose: packing lists
 * and customs declarations are internal, so a document type added later stays hidden until it is
 * listed here.
 */
export const CUSTOMER_DOCUMENT_TYPES = [
  'commercialInvoice',
  'billOfLading',
  'cmr',
  'certificateOfOrigin',
  'proofOfDelivery',
] as const satisfies readonly DocumentType[]

/** @see CUSTOMER_DOCUMENT_TYPES */
export type CustomerDocumentType = typeof CUSTOMER_DOCUMENT_TYPES[number]

/**
 * What the customer can do with a document: `download` it, wait for it (`pending`) or wait for the
 * delivery (`afterDelivery`, only the proof of delivery of a shipment that has not arrived).
 */
export type CustomerDocumentAvailability
  = | { kind: 'download', documentId: string }
    | { kind: 'pending' }
    | { kind: 'afterDelivery' }

/** One line of the customer documents card. It holds no file name and no ERP data. */
export type CustomerDocumentRow = {
  documentType: CustomerDocumentType
  availability: CustomerDocumentAvailability
}

function isCustomerDocumentType(documentType: DocumentType): documentType is CustomerDocumentType {
  return CUSTOMER_DOCUMENT_TYPES.some(customerType => customerType === documentType)
}

/**
 * Builds the documents card of the customer detail: one row per allow-listed document type the
 * ERP order requires, plus the proof of delivery, which every shipment shows whether or not the
 * order requires it. Only the types are read from the order, never its values.
 *
 * - A received document can be downloaded.
 * - A proof of delivery that has not been received is "after delivery" until the shipment is
 *   delivered, and pending afterwards.
 * - Any other document that is pending or has no entry at all is pending.
 */
export function buildCustomerDocumentRows(shipment: Shipment): CustomerDocumentRow[] {
  const shownTypes = new Set<CustomerDocumentType>(['proofOfDelivery', ...shipment.erpOrder.requiredDocuments.filter(isCustomerDocumentType)])
  const delivered = isDelivered(shipment)

  return CUSTOMER_DOCUMENT_TYPES.filter(documentType => shownTypes.has(documentType)).map((documentType): CustomerDocumentRow => {
    const received = shipment.documents.find(document => document.type === documentType && document.status === 'received')
    if (received !== undefined) {
      return { documentType, availability: { kind: 'download', documentId: received.id } }
    }
    if (documentType === 'proofOfDelivery' && !delivered) {
      return { documentType, availability: { kind: 'afterDelivery' } }
    }
    return { documentType, availability: { kind: 'pending' } }
  })
}
