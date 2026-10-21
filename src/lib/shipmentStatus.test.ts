import { createSeed } from '@/api/seed'
import type { Milestone, Shipment } from '@/api/types'
import { getShipmentStatus, isDelivered } from '@/lib/shipmentStatus'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

type DerivedMilestoneFields = Pick<Milestone, 'id' | 'status' | 'occurredAt' | 'receivedAt'>

function buildMilestone(fields: DerivedMilestoneFields): Milestone {
  return { legId: 'SH-1042-L1', location: 'Zaragoza plant', source: 'derived', ...fields }
}

describe('getShipmentStatus', () => {
  it('returns unknown when the shipment has no milestones', () => {
    const shipment = { ...getSeedShipment('SH-1042'), milestones: [] }

    const status = getShipmentStatus(shipment)

    expect(status).toEqual({ kind: 'unknown' })
  })

  it('returns the status of the latest milestone of a seed shipment', () => {
    const shipment = getSeedShipment('SH-1042')

    const status = getShipmentStatus(shipment)

    expect(status.kind === 'known' && status.status).toBe('customsHold')
  })

  it('picks the latest milestone by occurredAt even when it is listed first', () => {
    const shipment: Shipment = {
      ...getSeedShipment('SH-1042'),
      milestones: [
        buildMilestone({ id: 'M-late', status: 'inTransit', occurredAt: '2026-10-19T12:00:00.000Z', receivedAt: '2026-10-19T12:10:00.000Z' }),
        buildMilestone({ id: 'M-early', status: 'pickedUp', occurredAt: '2026-10-19T08:00:00.000Z', receivedAt: '2026-10-19T08:10:00.000Z' }),
      ],
    }

    const status = getShipmentStatus(shipment)

    expect(status.kind === 'known' && status.milestone.id).toBe('M-late')
  })

  it('prefers the milestone received last when two occurred at the same time', () => {
    const shipment: Shipment = {
      ...getSeedShipment('SH-1042'),
      milestones: [
        buildMilestone({ id: 'M-received-first', status: 'inTransit', occurredAt: '2026-10-19T12:00:00.000Z', receivedAt: '2026-10-19T12:05:00.000Z' }),
        buildMilestone({ id: 'M-received-last', status: 'delayed', occurredAt: '2026-10-19T12:00:00.000Z', receivedAt: '2026-10-19T12:40:00.000Z' }),
      ],
    }

    const status = getShipmentStatus(shipment)

    expect(status.kind === 'known' && status.milestone.id).toBe('M-received-last')
  })

  it('does not depend on the receipt order when occurredAt differs', () => {
    const shipment: Shipment = {
      ...getSeedShipment('SH-1042'),
      milestones: [
        buildMilestone({ id: 'M-occurred-first', status: 'pickedUp', occurredAt: '2026-10-19T08:00:00.000Z', receivedAt: '2026-10-19T20:00:00.000Z' }),
        buildMilestone({ id: 'M-occurred-last', status: 'inTransit', occurredAt: '2026-10-19T09:00:00.000Z', receivedAt: '2026-10-19T09:05:00.000Z' }),
      ],
    }

    const status = getShipmentStatus(shipment)

    expect(status.kind === 'known' && status.milestone.id).toBe('M-occurred-last')
  })
})

describe('isDelivered', () => {
  it('is true for the seeded delivered shipment SH-1009', () => {
    const shipment = getSeedShipment('SH-1009')

    expect(isDelivered(shipment)).toBe(true)
  })

  it('is false when the latest milestone is not the delivery', () => {
    const shipment = getSeedShipment('SH-1042')

    expect(isDelivered(shipment)).toBe(false)
  })

  it('is false when the shipment has no milestones', () => {
    const shipment = { ...getSeedShipment('SH-1009'), milestones: [] }

    expect(isDelivered(shipment)).toBe(false)
  })
})
