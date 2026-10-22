import { createSeed } from '@/api/seed'
import type { DocumentType, Shipment } from '@/api/types'
import { buildCustomerDocumentRows, CUSTOMER_DOCUMENT_TYPES } from '@/lib/customerDocuments'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

/** SH-1009 whose ERP order does not require the proof of delivery. */
function buildDeliveredShipmentWithoutRequiredProof(): Shipment {
  const shipment = getSeedShipment('SH-1009')

  return {
    ...shipment,
    erpOrder: {
      ...shipment.erpOrder,
      requiredDocuments: shipment.erpOrder.requiredDocuments.filter(documentType => documentType !== 'proofOfDelivery'),
    },
  }
}

function withoutProofOfDelivery(shipment: Shipment): Shipment {
  return { ...shipment, documents: shipment.documents.filter(document => document.type !== 'proofOfDelivery') }
}

describe('CUSTOMER_DOCUMENT_TYPES', () => {
  it('lists the customer-visible types in display order and leaves out the internal ones', () => {
    const types: readonly DocumentType[] = CUSTOMER_DOCUMENT_TYPES

    expect(types).toEqual(['commercialInvoice', 'billOfLading', 'cmr', 'certificateOfOrigin', 'proofOfDelivery'])
    expect(types).not.toContain('packingList')
    expect(types).not.toContain('customsDeclaration')
  })
})

describe('buildCustomerDocumentRows', () => {
  describe('allow-list', () => {
    it('hides the packing list and the customs declaration of SH-1042', () => {
      const shipment = getSeedShipment('SH-1042')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.map(row => row.documentType)).toEqual([
        'commercialInvoice',
        'billOfLading',
        'certificateOfOrigin',
        'proofOfDelivery',
      ])
    })

    it('shows only the types the ERP order requires, plus the proof of delivery', () => {
      const shipment = getSeedShipment('SH-1029')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.map(row => row.documentType)).toEqual(['commercialInvoice', 'cmr', 'proofOfDelivery'])
    })

    it('lists every visible document of SH-1047 in display order', () => {
      const shipment = getSeedShipment('SH-1047')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.map(row => row.documentType)).toEqual([
        'commercialInvoice',
        'billOfLading',
        'cmr',
        'certificateOfOrigin',
        'proofOfDelivery',
      ])
    })

    it('carries no file name or ERP value', () => {
      const shipment = getSeedShipment('SH-1042')

      const rows = buildCustomerDocumentRows(shipment)

      expect(JSON.stringify(rows)).not.toContain('.pdf')
      expect(JSON.stringify(rows)).not.toContain('8467')
    })
  })

  describe('required documents', () => {
    it('offers a received document for download with its id', () => {
      const shipment = getSeedShipment('SH-1042')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows[0]).toEqual({
        documentType: 'commercialInvoice',
        availability: { kind: 'download', documentId: 'SH-1042-commercialInvoice' },
      })
    })

    it('marks a required document that has no entry as pending', () => {
      const shipment = getSeedShipment('SH-1042')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows[2]).toEqual({ documentType: 'certificateOfOrigin', availability: { kind: 'pending' } })
    })

    it('marks a required document that is explicitly pending as pending', () => {
      const shipment = getSeedShipment('SH-1047')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows[1]).toEqual({ documentType: 'billOfLading', availability: { kind: 'pending' } })
    })
  })

  describe('proof of delivery', () => {
    it('is after delivery while the shipment is in transit', () => {
      const shipment = getSeedShipment('SH-1042')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.at(-1)).toEqual({ documentType: 'proofOfDelivery', availability: { kind: 'afterDelivery' } })
    })

    it('is after delivery in transit even though the ERP order does not require it', () => {
      const shipment = getSeedShipment('SH-1029')

      const rows = buildCustomerDocumentRows(shipment)

      expect(shipment.erpOrder.requiredDocuments).not.toContain('proofOfDelivery')
      expect(rows.at(-1)).toEqual({ documentType: 'proofOfDelivery', availability: { kind: 'afterDelivery' } })
    })

    it('is downloadable when the shipment is delivered and the proof was received', () => {
      const shipment = getSeedShipment('SH-1009')

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.at(-1)).toEqual({
        documentType: 'proofOfDelivery',
        availability: { kind: 'download', documentId: 'SH-1009-proofOfDelivery' },
      })
    })

    it('is downloadable for a delivered shipment whose ERP order does not require it', () => {
      const shipment = buildDeliveredShipmentWithoutRequiredProof()

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.at(-1)).toEqual({
        documentType: 'proofOfDelivery',
        availability: { kind: 'download', documentId: 'SH-1009-proofOfDelivery' },
      })
    })

    it('is pending when the shipment is delivered and the proof has no entry', () => {
      const shipment = withoutProofOfDelivery(getSeedShipment('SH-1009'))

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.at(-1)).toEqual({ documentType: 'proofOfDelivery', availability: { kind: 'pending' } })
    })

    it('is pending when the shipment is delivered and the proof is not received yet', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = {
        ...base,
        documents: base.documents.map(document =>
          document.type === 'proofOfDelivery' ? { id: document.id, type: document.type, status: 'pending' } : document),
      }

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.at(-1)).toEqual({ documentType: 'proofOfDelivery', availability: { kind: 'pending' } })
    })

    it('is pending for a delivered shipment without the proof when the ERP order does not require it', () => {
      const shipment = withoutProofOfDelivery(buildDeliveredShipmentWithoutRequiredProof())

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.at(-1)).toEqual({ documentType: 'proofOfDelivery', availability: { kind: 'pending' } })
    })
  })

  describe('order', () => {
    it('follows the allow-list order whatever the order of the ERP requirements', () => {
      const base = getSeedShipment('SH-1042')
      const shipment: Shipment = {
        ...base,
        erpOrder: { ...base.erpOrder, requiredDocuments: ['certificateOfOrigin', 'cmr', 'billOfLading', 'commercialInvoice'] },
      }

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows.map(row => row.documentType)).toEqual([
        'commercialInvoice',
        'billOfLading',
        'cmr',
        'certificateOfOrigin',
        'proofOfDelivery',
      ])
    })

    it('shows only the proof of delivery when the order requires no visible document', () => {
      const base = getSeedShipment('SH-1042')
      const shipment: Shipment = {
        ...base,
        erpOrder: { ...base.erpOrder, requiredDocuments: ['packingList', 'customsDeclaration'] },
      }

      const rows = buildCustomerDocumentRows(shipment)

      expect(rows).toEqual([{ documentType: 'proofOfDelivery', availability: { kind: 'afterDelivery' } }])
    })
  })
})
