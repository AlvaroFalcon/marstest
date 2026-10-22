import type { ReferenceData, Shipment } from '@/api/types'
import { createSeed } from '@/api/seed'
import {
  buildDocumentRows,
  buildExceptionLayer,
  buildShipmentDetail,
  getCarriersLabel,
  getLatestEventSource,
  pickMostUrgentException,
} from '@/lib/exceptionDetail'

const seed = createSeed()
const referenceData: ReferenceData = { customers: seed.customers, sites: seed.sites, carriers: seed.carriers }

function findSeedShipment(shipmentId: string): Shipment {
  const shipment = seed.shipments.find(candidate => candidate.id === shipmentId)
  if (shipment === undefined) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

const customsHoldShipment = findSeedShipment('SH-1042')

describe('getCarriersLabel', () => {
  it('lists the carriers in leg order without repeating one that has two legs', () => {
    expect(getCarriersLabel(customsHoldShipment, seed.carriers)).toBe('Transauto · Nordsee Line')
  })

  it('falls back to the carrier id when the carrier is unknown', () => {
    expect(getCarriersLabel(customsHoldShipment, [])).toBe('transauto · nordsee-line')
  })
})

describe('getLatestEventSource', () => {
  it('returns the carrier and channel of the event received last', () => {
    const shipment: Shipment = {
      ...customsHoldShipment,
      rawEvents: [
        { ...customsHoldShipment.rawEvents[0]!, carrierId: 'transauto', channel: 'api', receivedAt: '2026-10-18T10:00:00.000Z' },
        { ...customsHoldShipment.rawEvents[0]!, carrierId: 'nordsee-line', channel: 'edi', receivedAt: '2026-10-19T10:00:00.000Z' },
      ],
    }

    expect(getLatestEventSource(shipment, seed.carriers)).toEqual({ carrierName: 'Nordsee Line', channel: 'edi' })
  })

  it('returns null when the shipment has no raw events', () => {
    expect(getLatestEventSource({ ...customsHoldShipment, rawEvents: [] }, seed.carriers)).toBeNull()
  })
})

describe('pickMostUrgentException', () => {
  it('returns the only open exception', () => {
    expect(pickMostUrgentException(customsHoldShipment)?.type).toBe('customsHold')
  })

  it('prefers the most urgent type when there are several', () => {
    const staleException = { ...customsHoldShipment.exceptions[0]!, id: 'stale', type: 'staleTracking' as const }
    const shipment: Shipment = { ...customsHoldShipment, exceptions: [staleException, ...customsHoldShipment.exceptions] }

    expect(pickMostUrgentException(shipment)?.type).toBe('customsHold')
  })

  it('returns null when no exception is open', () => {
    expect(pickMostUrgentException({ ...customsHoldShipment, exceptions: [] })).toBeNull()
  })
})

describe('buildDocumentRows', () => {
  it('returns one row per required document in ERP order', () => {
    const rows = buildDocumentRows(customsHoldShipment, 'customsHold')

    expect(rows.map(row => row.documentType)).toEqual([
      'commercialInvoice',
      'packingList',
      'billOfLading',
      'certificateOfOrigin',
      'customsDeclaration',
    ])
  })

  it('shows the HS code mismatch of the commercial invoice', () => {
    const [invoiceRow] = buildDocumentRows(customsHoldShipment, 'customsHold')

    expect(invoiceRow?.result).toMatchObject({ kind: 'mismatch', field: 'hsCode', expected: '8467.21', actual: '8467.29' })
  })

  it('lets a mismatch win over a match on the same document', () => {
    const [invoiceRow] = buildDocumentRows(customsHoldShipment, 'customsHold')

    expect(invoiceRow?.result.kind).toBe('mismatch')
  })

  it('shows a weight match for a document that only carries the weight', () => {
    const [, packingListRow] = buildDocumentRows(customsHoldShipment, 'customsHold')

    expect(packingListRow?.result).toMatchObject({ kind: 'match', field: 'grossWeightKg' })
  })

  it('marks the missing certificate of origin as the cause of a customs hold', () => {
    const rows = buildDocumentRows(customsHoldShipment, 'customsHold')

    expect(rows.find(row => row.documentType === 'certificateOfOrigin')).toMatchObject({
      result: { kind: 'missing' },
      isCauseOfHold: true,
    })
  })

  it('does not mark the missing certificate of origin as a cause for another exception type', () => {
    const rows = buildDocumentRows(customsHoldShipment, 'incident')

    expect(rows.find(row => row.documentType === 'certificateOfOrigin')?.isCauseOfHold).toBe(false)
  })

  it('shows a pending document as pending', () => {
    const shipment: Shipment = {
      ...customsHoldShipment,
      documents: [
        ...customsHoldShipment.documents,
        { id: 'pending-coo', type: 'certificateOfOrigin', status: 'pending' },
      ],
    }

    const rows = buildDocumentRows(shipment, 'customsHold')

    expect(rows.find(row => row.documentType === 'certificateOfOrigin')).toMatchObject({
      result: { kind: 'pending' },
      isCauseOfHold: false,
    })
  })

  it('shows a received document without comparable fields as received', () => {
    const shipment: Shipment = {
      ...customsHoldShipment,
      documents: [
        ...customsHoldShipment.documents,
        { id: 'coo', type: 'certificateOfOrigin', status: 'received', fileName: 'coo.pdf', receivedAt: '2026-10-19T10:00:00.000Z', extracted: {} },
      ],
    }

    const rows = buildDocumentRows(shipment, 'customsHold')

    expect(rows.find(row => row.documentType === 'certificateOfOrigin')?.result.kind).toBe('received')
  })
})

describe('buildShipmentDetail', () => {
  it('resolves the labels of the header and the internal data row', () => {
    const detail = buildShipmentDetail(customsHoldShipment, referenceData)

    expect(detail).toMatchObject({
      shipmentId: 'SH-1042',
      routeLabel: 'Zaragoza → Birmingham',
      customerName: 'Nordwerk GmbH',
      originSiteName: 'Zaragoza plant',
      carriersLabel: 'Transauto · Nordsee Line',
      poNumber: '4500-1187',
      etaCarrierName: 'Nordsee Line',
    })
  })

  it('names the last carrier in the ETA card when the carrier gives no ETA', () => {
    const shipment: Shipment = { ...customsHoldShipment, carrierEta: { status: 'notProvided' } }

    expect(buildShipmentDetail(shipment, referenceData).etaCarrierName).toBe('Transauto')
  })
})

describe('buildExceptionLayer', () => {
  it('counts the cited events and the received documents', () => {
    const [exception] = customsHoldShipment.exceptions

    const layer = buildExceptionLayer(customsHoldShipment, exception!)

    expect(layer).toMatchObject({ type: 'customsHold', citedEventCount: 2, receivedDocumentCount: 4 })
  })

  it('does not count pending documents as evidence', () => {
    const shipment: Shipment = {
      ...customsHoldShipment,
      documents: [...customsHoldShipment.documents, { id: 'pending-coo', type: 'certificateOfOrigin', status: 'pending' }],
    }

    const layer = buildExceptionLayer(shipment, shipment.exceptions[0]!)

    expect(layer.receivedDocumentCount).toBe(4)
  })
})
