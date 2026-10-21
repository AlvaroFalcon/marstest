import { createSeed } from '@/api/seed'
import type { Shipment, ShipmentDocument } from '@/api/types'
import { checkDocuments } from '@/lib/documentCheck'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

/**
 * A shipment whose ERP order expects HS code 8467.21, 1000 kg and only a commercial invoice,
 * with the given documents attached.
 */
function buildShipmentWithDocuments(documents: ShipmentDocument[]): Shipment {
  const shipment = getSeedShipment('SH-1042')
  return {
    ...shipment,
    erpOrder: { ...shipment.erpOrder, hsCode: '8467.21', grossWeightKg: 1000, requiredDocuments: ['commercialInvoice'] },
    documents,
  }
}

function buildInvoice(extracted: { hsCode?: string, grossWeightKg?: number }): ShipmentDocument {
  return {
    id: 'DOC-1',
    type: 'commercialInvoice',
    status: 'received',
    fileName: 'invoice.pdf',
    receivedAt: '2026-10-14T04:00:00.000Z',
    extracted,
  }
}

describe('checkDocuments', () => {
  describe('seeded SH-1042', () => {
    it('reports the HS code mismatch on the invoice and the customs declaration', () => {
      const result = checkDocuments(getSeedShipment('SH-1042'))

      const mismatches = result.findings.filter(finding => finding.kind === 'mismatch')

      expect(mismatches).toEqual([
        { kind: 'mismatch', documentId: 'SH-1042-commercialInvoice', documentType: 'commercialInvoice', field: 'hsCode', expected: '8467.21', actual: '8467.29' },
        { kind: 'mismatch', documentId: 'SH-1042-customsDeclaration', documentType: 'customsDeclaration', field: 'hsCode', expected: '8467.21', actual: '8467.29' },
      ])
    })

    it('reports the missing certificate of origin', () => {
      const result = checkDocuments(getSeedShipment('SH-1042'))

      const missing = result.findings.filter(finding => finding.kind === 'missing')

      expect(missing).toEqual([{ kind: 'missing', documentType: 'certificateOfOrigin' }])
    })

    it('reports the four gross weights as matching 1840 kg', () => {
      const result = checkDocuments(getSeedShipment('SH-1042'))

      const weightMatches = result.findings.filter(finding => finding.kind === 'match' && finding.field === 'grossWeightKg')

      expect(weightMatches.map(finding => finding.kind === 'match' && finding.documentType)).toEqual([
        'commercialInvoice',
        'packingList',
        'billOfLading',
        'customsDeclaration',
      ])
    })

    it('has issues', () => {
      expect(checkDocuments(getSeedShipment('SH-1042')).hasIssues).toBe(true)
    })
  })

  describe('HS code', () => {
    it('matches when the document writes the code without the dot', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ hsCode: '846721' })])

      const result = checkDocuments(shipment)

      expect(result.findings).toEqual([
        { kind: 'match', documentId: 'DOC-1', documentType: 'commercialInvoice', field: 'hsCode', expected: '8467.21', actual: '846721' },
      ])
      expect(result.hasIssues).toBe(false)
    })

    it('matches when the document separates the code with spaces', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ hsCode: '8467 21' })])

      const result = checkDocuments(shipment)

      expect(result.findings[0].kind).toBe('match')
    })

    it('mismatches when a digit differs', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ hsCode: '8467.22' })])

      const result = checkDocuments(shipment)

      expect(result.findings[0].kind).toBe('mismatch')
      expect(result.hasIssues).toBe(true)
    })
  })

  describe('gross weight', () => {
    it('matches at exactly 1 % above the ERP weight', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ grossWeightKg: 1010 })])

      const result = checkDocuments(shipment)

      expect(result.findings[0].kind).toBe('match')
    })

    it('matches at exactly 1 % below the ERP weight', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ grossWeightKg: 990 })])

      const result = checkDocuments(shipment)

      expect(result.findings[0].kind).toBe('match')
    })

    it('mismatches just over 1 % above the ERP weight', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ grossWeightKg: 1010.1 })])

      const result = checkDocuments(shipment)

      expect(result.findings).toEqual([
        { kind: 'mismatch', documentId: 'DOC-1', documentType: 'commercialInvoice', field: 'grossWeightKg', expected: 1000, actual: 1010.1 },
      ])
    })

    it('mismatches just over 1 % below the ERP weight', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ grossWeightKg: 989.9 })])

      const result = checkDocuments(shipment)

      expect(result.findings[0].kind).toBe('mismatch')
    })
  })

  describe('document states', () => {
    it('compares both fields of one document as separate findings', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ hsCode: '8467.21', grossWeightKg: 1200 })])

      const result = checkDocuments(shipment)

      expect(result.findings.map(finding => [finding.kind, 'field' in finding ? finding.field : null])).toEqual([
        ['match', 'hsCode'],
        ['mismatch', 'grossWeightKg'],
      ])
    })

    it('reports no findings for a received document without extracted fields', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({})])

      const result = checkDocuments(shipment)

      expect(result).toEqual({ findings: [], hasIssues: false })
    })

    it('reports a pending document as pending and not as an issue', () => {
      const shipment = buildShipmentWithDocuments([{ id: 'DOC-1', type: 'commercialInvoice', status: 'pending' }])

      const result = checkDocuments(shipment)

      expect(result).toEqual({
        findings: [{ kind: 'pending', documentId: 'DOC-1', documentType: 'commercialInvoice' }],
        hasIssues: false,
      })
    })

    it('reports a required document with no entry as missing', () => {
      const shipment = buildShipmentWithDocuments([])

      const result = checkDocuments(shipment)

      expect(result).toEqual({
        findings: [{ kind: 'missing', documentType: 'commercialInvoice' }],
        hasIssues: true,
      })
    })

    it('does not report a pending required document as missing', () => {
      const shipment = buildShipmentWithDocuments([{ id: 'DOC-1', type: 'commercialInvoice', status: 'pending' }])

      const result = checkDocuments(shipment)

      expect(result.findings.some(finding => finding.kind === 'missing')).toBe(false)
    })

    it('reports no issues when everything matches', () => {
      const shipment = buildShipmentWithDocuments([buildInvoice({ hsCode: '8467.21', grossWeightKg: 1000 })])

      expect(checkDocuments(shipment).hasIssues).toBe(false)
    })
  })

  it('finds no issues in the seeded SH-1033', () => {
    expect(checkDocuments(getSeedShipment('SH-1033')).hasIssues).toBe(false)
  })
})
