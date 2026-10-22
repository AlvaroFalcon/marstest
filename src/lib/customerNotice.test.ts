import { createSeed } from '@/api/seed'
import type { ShipmentException } from '@/api/types'
import { hasPendingDraft, isCustomerNotified, shouldOfferCertificateActions } from '@/lib/customerNotice'
import type { DocumentRow } from '@/lib/exceptionDetail'

const [seedException] = createSeed().shipments.flatMap(shipment => shipment.exceptions)

function buildException(draft: ShipmentException['draft']): ShipmentException {
  return { ...seedException, draft }
}

describe('isCustomerNotified', () => {
  it('is true when the draft was sent', () => {
    const exception = buildException({ status: 'sent', body: 'Hello John', notifiedAt: '2026-10-20T10:00:00.000Z' })

    expect(isCustomerNotified(exception)).toBe(true)
  })

  it.each([
    ['pending', { status: 'pending', body: 'Hello John' }],
    ['discarded', { status: 'discarded', discardedAt: '2026-10-20T10:00:00.000Z' }],
    ['none', { status: 'none' }],
  ] as const)('is false when the draft is %s', (_name, draft) => {
    expect(isCustomerNotified(buildException(draft))).toBe(false)
  })
})

describe('hasPendingDraft', () => {
  it('is true when the draft waits for approval', () => {
    expect(hasPendingDraft(buildException({ status: 'pending', body: 'Hello John' }))).toBe(true)
  })

  it.each([
    ['sent', { status: 'sent', body: 'Hello John', notifiedAt: '2026-10-20T10:00:00.000Z' }],
    ['discarded', { status: 'discarded', discardedAt: '2026-10-20T10:00:00.000Z' }],
    ['none', { status: 'none' }],
  ] as const)('is false when the draft is %s', (_name, draft) => {
    expect(hasPendingDraft(buildException(draft))).toBe(false)
  })
})

describe('shouldOfferCertificateActions', () => {
  it('is true when a missing document is the cause of the hold', () => {
    const rows: DocumentRow[] = [
      { documentType: 'commercialInvoice', result: { kind: 'received', documentType: 'commercialInvoice' }, isCauseOfHold: false },
      { documentType: 'certificateOfOrigin', result: { kind: 'missing', documentType: 'certificateOfOrigin' }, isCauseOfHold: true },
    ]

    expect(shouldOfferCertificateActions(rows)).toBe(true)
  })

  it('is false when no document row causes the hold', () => {
    const rows: DocumentRow[] = [
      { documentType: 'commercialInvoice', result: { kind: 'received', documentType: 'commercialInvoice' }, isCauseOfHold: false },
    ]

    expect(shouldOfferCertificateActions(rows)).toBe(false)
  })

  it('is false when there are no document rows', () => {
    expect(shouldOfferCertificateActions([])).toBe(false)
  })
})
