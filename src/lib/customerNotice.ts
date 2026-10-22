import type { ShipmentException } from '@/api/types'
import type { DocumentRow } from '@/lib/exceptionDetail'

/** True once the customer notice of the exception was approved and sent. */
export function isCustomerNotified(exception: ShipmentException): boolean {
  return exception.draft.status === 'sent'
}

/** True while the AI draft waits for ops approval: the only state in which it can be edited. */
export function hasPendingDraft(exception: ShipmentException): boolean {
  return exception.draft.status === 'pending'
}

/**
 * Tells whether to offer the manual certificate actions ("Upload certificate of origin",
 * "Request it from Chamber of Commerce"). Only a missing certificate of origin that keeps the
 * shipment in customs qualifies; the rule lives in `buildDocumentRows` and is reused, not copied.
 */
export function shouldOfferCertificateActions(documentRows: readonly DocumentRow[]): boolean {
  return documentRows.some(row => row.isCauseOfHold)
}
