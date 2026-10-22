import { createSeed } from '@/api/seed'
import type { Shipment } from '@/api/types'
import { getDeliveryVsPlan } from '@/lib/deliveryVsPlan'

const PLANNED_AT = '2026-10-19T10:00:00.000Z'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

/** SH-1009 with the plan and the delivery moved to the given instants. */
function buildDeliveredShipment(deliveredAt: string, plannedDeliveryAt: string = PLANNED_AT): Shipment {
  const shipment = getSeedShipment('SH-1009')

  return {
    ...shipment,
    plannedDeliveryAt,
    milestones: shipment.milestones.map(milestone =>
      milestone.status === 'delivered' ? { ...milestone, occurredAt: deliveredAt } : milestone),
  }
}

describe('getDeliveryVsPlan', () => {
  describe('shipments that are not delivered', () => {
    it('returns notDelivered for a shipment in transit', () => {
      const shipment = getSeedShipment('SH-1042')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'notDelivered' })
    })

    it('returns notDelivered when the shipment has no milestones', () => {
      const shipment = { ...getSeedShipment('SH-1009'), milestones: [] }

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'notDelivered' })
    })
  })

  describe('on time', () => {
    it('returns onTime when the delivery is at the planned instant', () => {
      const shipment = buildDeliveredShipment('2026-10-19T10:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'onTime' })
    })

    it('returns onTime when the delivery is exactly 1 h before the plan', () => {
      const shipment = buildDeliveredShipment('2026-10-19T09:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'onTime' })
    })

    it('returns onTime when the delivery is exactly 1 h after the plan', () => {
      const shipment = buildDeliveredShipment('2026-10-19T11:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'onTime' })
    })
  })

  describe('hours', () => {
    it('returns 1 h late as soon as the delivery is a minute past the tolerance', () => {
      const shipment = buildDeliveredShipment('2026-10-19T11:01:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'late', duration: { unit: 'hour', count: 1 } })
    })

    it('returns 1 h early as soon as the delivery is a minute before the tolerance', () => {
      const shipment = buildDeliveredShipment('2026-10-19T08:59:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'early', duration: { unit: 'hour', count: 1 } })
    })

    it('words a 23 h gap in hours', () => {
      const shipment = buildDeliveredShipment('2026-10-20T09:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'late', duration: { unit: 'hour', count: 23 } })
    })

    it('rounds an hour gap to the nearest hour', () => {
      const shipment = buildDeliveredShipment('2026-10-19T04:20:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'early', duration: { unit: 'hour', count: 6 } })
    })

    it('rounds 22 h 40 min up to 23 hours, still in hours', () => {
      const shipment = buildDeliveredShipment('2026-10-20T08:40:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'late', duration: { unit: 'hour', count: 23 } })
    })
  })

  describe('days', () => {
    it('words a 24 h gap in days', () => {
      const shipment = buildDeliveredShipment('2026-10-20T10:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'late', duration: { unit: 'day', count: 1 } })
    })

    it('returns 1 day early for the SH-1009 seed shipment', () => {
      const shipment = getSeedShipment('SH-1009')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'early', duration: { unit: 'day', count: 1 } })
    })

    it('returns 2 hours late for the SH-1012 seed shipment', () => {
      const shipment = getSeedShipment('SH-1012')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'late', duration: { unit: 'hour', count: 2 } })
    })

    it('rounds a gap of 1 day 13 h to 2 days', () => {
      const shipment = buildDeliveredShipment('2026-10-19T21:00:00.000Z', '2026-10-21T10:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'early', duration: { unit: 'day', count: 2 } })
    })

    it('rounds a gap of 2 days 11 h down to 2 days', () => {
      const shipment = buildDeliveredShipment('2026-10-21T21:00:00.000Z')

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'late', duration: { unit: 'day', count: 2 } })
    })
  })

  describe('baseline', () => {
    it('compares with the plan made at dispatch, not with the carrier ETA', () => {
      const shipment: Shipment = {
        ...buildDeliveredShipment('2026-10-19T10:00:00.000Z'),
        carrierEta: {
          status: 'provided',
          date: '2026-10-25T10:00:00.000Z',
          source: { carrierId: 'transauto', channel: 'api' },
          updatedAt: '2026-10-18T10:00:00.000Z',
        },
      }

      const result = getDeliveryVsPlan(shipment)

      expect(result).toEqual({ kind: 'onTime' })
    })
  })
})
