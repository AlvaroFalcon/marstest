import { createSeed, DEMO_NOW_ISO } from '@/api/seed'
import type { Shipment } from '@/api/types'
import { getFreshness } from '@/lib/freshness'

const DEMO_NOW = new Date(DEMO_NOW_ISO)

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

/** SH-1033 with its only tracking news received at the given time. */
function buildShipmentLastHeardAt(receivedAt: string): Shipment {
  const shipment = getSeedShipment('SH-1033')
  return {
    ...shipment,
    rawEvents: shipment.rawEvents.slice(0, 1).map(rawEvent => ({ ...rawEvent, receivedAt })),
    milestones: shipment.milestones.slice(0, 1).map(milestone => ({ ...milestone, receivedAt })),
  }
}

describe('getFreshness', () => {
  it('is fresh at exactly 24 hours without news', () => {
    const shipment = buildShipmentLastHeardAt('2026-10-19T10:00:00.000Z')

    const freshness = getFreshness(shipment, DEMO_NOW)

    expect(freshness).toEqual({ kind: 'fresh', lastUpdateAt: '2026-10-19T10:00:00.000Z', hoursSinceUpdate: 24 })
  })

  it('is stale one minute over 24 hours without news', () => {
    const shipment = buildShipmentLastHeardAt('2026-10-19T09:59:00.000Z')

    const freshness = getFreshness(shipment, DEMO_NOW)

    expect(freshness.kind).toBe('stale')
  })

  it('uses the most recent receipt among raw events and milestones', () => {
    const shipment = buildShipmentLastHeardAt('2026-10-18T10:00:00.000Z')
    const withRecentMilestone: Shipment = {
      ...shipment,
      milestones: shipment.milestones.map(milestone => ({ ...milestone, receivedAt: '2026-10-20T08:00:00.000Z' })),
    }

    const freshness = getFreshness(withRecentMilestone, DEMO_NOW)

    expect(freshness).toEqual({ kind: 'fresh', lastUpdateAt: '2026-10-20T08:00:00.000Z', hoursSinceUpdate: 2 })
  })

  it('uses when we learnt about the news, not when it happened', () => {
    const shipment = buildShipmentLastHeardAt('2026-10-20T09:00:00.000Z')
    const happenedLongAgo: Shipment = {
      ...shipment,
      milestones: shipment.milestones.map(milestone => ({ ...milestone, occurredAt: '2026-10-10T09:00:00.000Z' })),
    }

    const freshness = getFreshness(happenedLongAgo, DEMO_NOW)

    expect(freshness.kind).toBe('fresh')
  })

  it('falls back to the booking time when nothing was reported', () => {
    const shipment: Shipment = { ...getSeedShipment('SH-1033'), rawEvents: [], milestones: [], bookedAt: '2026-10-18T10:00:00.000Z' }

    const freshness = getFreshness(shipment, DEMO_NOW)

    expect(freshness).toEqual({ kind: 'stale', lastUpdateAt: '2026-10-18T10:00:00.000Z', hoursSinceUpdate: 48 })
  })

  it('is not applicable for a delivered shipment however old its last news is', () => {
    const shipment = getSeedShipment('SH-1009')

    const freshness = getFreshness(shipment, new Date('2027-01-01T00:00:00.000Z'))

    expect(freshness).toEqual({ kind: 'notApplicable' })
  })

  it('marks the seeded SH-1029 as stale after 48 hours without news', () => {
    const shipment = getSeedShipment('SH-1029')

    const freshness = getFreshness(shipment, DEMO_NOW)

    expect(freshness.kind).toBe('stale')
    expect(freshness.kind === 'stale' && Math.round(freshness.hoursSinceUpdate)).toBe(48)
  })

  it('marks the seeded SH-1033 as fresh', () => {
    const shipment = getSeedShipment('SH-1033')

    const freshness = getFreshness(shipment, DEMO_NOW)

    expect(freshness.kind).toBe('fresh')
  })
})
