import { createSeed } from '@/api/seed'
import type { ReferenceData, Shipment } from '@/api/types'
import { buildCustomerShipmentDetail } from '@/lib/customerShipmentDetail'

const NOW = new Date('2026-10-20T10:00:00.000Z')

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

function getReferenceData(): ReferenceData {
  const { customers, sites, carriers } = createSeed()

  return { customers, sites, carriers }
}

describe('buildCustomerShipmentDetail', () => {
  describe('header', () => {
    it('resolves the id, the route and the list status of SH-1042', () => {
      const shipment = getSeedShipment('SH-1042')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.shipmentId).toBe('SH-1042')
      expect(detail.routeLabel).toBe('Zaragoza → Birmingham')
      expect(detail.status).toBe('atRisk')
    })

    it('resolves the carrier names by id', () => {
      const shipment = getSeedShipment('SH-1042')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.carrierNames).toMatchObject({
        'transauto': 'Transauto',
        'nordsee-line': 'Nordsee Line',
      })
    })
  })

  describe('freshness', () => {
    it('is tracking with the real freshness for a shipment that is quiet for more than 24 h', () => {
      const shipment = getSeedShipment('SH-1042')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.freshness).toMatchObject({
        kind: 'tracking',
        freshness: { kind: 'stale', lastUpdateAt: '2026-10-19T08:20:00.000Z' },
      })
    })

    it('is tracking and fresh for a shipment updated a few hours ago', () => {
      const shipment = getSeedShipment('SH-1037')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.freshness).toMatchObject({
        kind: 'tracking',
        freshness: { kind: 'fresh', lastUpdateAt: '2026-10-20T08:00:00.000Z', hoursSinceUpdate: 2 },
      })
    })

    it('is final for a delivered shipment however old its last update is', () => {
      const shipment = getSeedShipment('SH-1009')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), new Date('2027-03-01T10:00:00.000Z'))

      expect(detail.freshness).toEqual({ kind: 'final' })
    })
  })

  describe('arrival', () => {
    it('is in transit with the carrier that reported the ETA', () => {
      const shipment = getSeedShipment('SH-1042')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.arrival).toEqual({ kind: 'inTransit', etaCarrierName: 'Nordsee Line' })
    })

    it('falls back to the carrier of the last leg when the carrier gave no ETA', () => {
      const shipment: Shipment = { ...getSeedShipment('SH-1042'), carrierEta: { status: 'notProvided' } }

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.arrival).toEqual({ kind: 'inTransit', etaCarrierName: 'Transauto' })
    })

    it('is delivered with the delivery against the plan, the source and the signed proof', () => {
      const shipment = getSeedShipment('SH-1009')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.arrival).toEqual({
        kind: 'delivered',
        deliveredAt: '2026-10-18T10:00:00.000Z',
        plannedDeliveryAt: '2026-10-19T10:00:00.000Z',
        deliveryVsPlan: { kind: 'early', duration: { unit: 'day', count: 1 } },
        source: { carrierName: 'Transauto', channel: 'api' },
        hasSignedProofOfDelivery: true,
      })
    })

    it('names the carrier and channel of the delivery message for a portal delivery', () => {
      const shipment = getSeedShipment('SH-1012')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.arrival).toMatchObject({
        kind: 'delivered',
        deliveryVsPlan: { kind: 'late', duration: { unit: 'hour', count: 2 } },
        source: { carrierName: 'Vascor Trans', channel: 'portal' },
      })
    })

    it('has no source when the delivery milestone is derived and has no carrier event', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = {
        ...base,
        milestones: base.milestones.map(milestone =>
          milestone.status === 'delivered'
            ? {
                id: milestone.id,
                legId: milestone.legId,
                status: milestone.status,
                location: milestone.location,
                occurredAt: milestone.occurredAt,
                receivedAt: milestone.receivedAt,
                source: 'derived',
              }
            : milestone),
      }

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.arrival).toMatchObject({ kind: 'delivered', source: null })
    })

    it('has no signed proof when the proof of delivery was not received', () => {
      const base = getSeedShipment('SH-1009')
      const shipment: Shipment = {
        ...base,
        documents: base.documents.filter(document => document.type !== 'proofOfDelivery'),
      }

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.arrival).toMatchObject({ kind: 'delivered', hasSignedProofOfDelivery: false })
    })
  })

  describe('summary and documents', () => {
    it('builds the summary with the origin city resolved from the sites', () => {
      const shipment = getSeedShipment('SH-1042')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.summary.text).toContain('Your order left Zaragoza on Oct 14.')
      expect(detail.summary.eventCount).toBe(6)
    })

    it('builds the document rows of the customer', () => {
      const shipment = getSeedShipment('SH-1009')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(detail.documents.map(row => `${row.documentType}:${row.availability.kind}`)).toEqual([
        'commercialInvoice:download',
        'cmr:download',
        'proofOfDelivery:download',
      ])
    })
  })

  describe('internal data', () => {
    it('exposes only customer-safe fields', () => {
      const shipment = getSeedShipment('SH-1042')

      const detail = buildCustomerShipmentDetail(shipment, getReferenceData(), NOW)

      expect(Object.keys(detail).toSorted()).toEqual([
        'arrival',
        'carrierNames',
        'documents',
        'freshness',
        'routeLabel',
        'shipmentId',
        'status',
        'summary',
      ])
    })

    it('contains no diagnosis, draft, ERP value or file name for SH-1042', () => {
      const shipment = getSeedShipment('SH-1042')

      const serialized = JSON.stringify(buildCustomerShipmentDetail(shipment, getReferenceData(), NOW))

      expect(serialized).not.toContain('Held by UK customs')
      expect(serialized).not.toContain('demurrage')
      expect(serialized).not.toContain('Hello Nordwerk team')
      expect(serialized).not.toContain('8467')
      expect(serialized).not.toContain('4500-1187')
      expect(serialized).not.toContain('.pdf')
    })
  })
})
