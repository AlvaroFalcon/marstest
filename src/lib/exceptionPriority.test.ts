import { createSeed } from '@/api/seed'
import type { ExceptionType, Shipment } from '@/api/types'
import { getExceptionUrgencyRank, listExceptionsByUrgency } from '@/lib/exceptionPriority'
import { scopeShipments } from '@/lib/scope'

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

/** SH-1033 (no exceptions in the seed) with one open exception of the given type. */
function buildShipmentWithException(shipmentId: string, type: ExceptionType, openedAt: string): Shipment {
  const base = getSeedShipment('SH-1042')
  return {
    ...getSeedShipment('SH-1033'),
    id: shipmentId,
    exceptions: [{ ...base.exceptions[0], id: `${shipmentId}-X1`, type, openedAt }],
  }
}

function listIds(shipments: Shipment[]): string[] {
  return listExceptionsByUrgency(shipments).map(entry => entry.shipment.id)
}

describe('getExceptionUrgencyRank', () => {
  it('ranks the types from most to least urgent', () => {
    const types: ExceptionType[] = ['staleTracking', 'predictedDelay', 'vesselRolled', 'incident', 'customsHold']

    const ranks = types.map(getExceptionUrgencyRank)

    expect(ranks).toEqual([4, 3, 2, 1, 0])
  })
})

describe('listExceptionsByUrgency', () => {
  it('returns nothing when no shipment has open exceptions', () => {
    const shipments = [getSeedShipment('SH-1033'), getSeedShipment('SH-1009')]

    expect(listExceptionsByUrgency(shipments)).toEqual([])
  })

  it('orders by type rank before age', () => {
    const shipments = [
      buildShipmentWithException('SH-A', 'staleTracking', '2026-10-01T00:00:00.000Z'),
      buildShipmentWithException('SH-B', 'predictedDelay', '2026-10-02T00:00:00.000Z'),
      buildShipmentWithException('SH-C', 'vesselRolled', '2026-10-03T00:00:00.000Z'),
      buildShipmentWithException('SH-D', 'incident', '2026-10-04T00:00:00.000Z'),
      buildShipmentWithException('SH-E', 'customsHold', '2026-10-05T00:00:00.000Z'),
    ]

    expect(listIds(shipments)).toEqual(['SH-E', 'SH-D', 'SH-C', 'SH-B', 'SH-A'])
  })

  it('puts the exception open for longest first within the same type', () => {
    const shipments = [
      buildShipmentWithException('SH-A', 'incident', '2026-10-20T08:00:00.000Z'),
      buildShipmentWithException('SH-B', 'incident', '2026-10-19T08:00:00.000Z'),
    ]

    expect(listIds(shipments)).toEqual(['SH-B', 'SH-A'])
  })

  it('breaks a tie on type and openedAt by shipment id', () => {
    const shipments = [
      buildShipmentWithException('SH-2000', 'incident', '2026-10-20T08:00:00.000Z'),
      buildShipmentWithException('SH-1000', 'incident', '2026-10-20T08:00:00.000Z'),
    ]

    expect(listIds(shipments)).toEqual(['SH-1000', 'SH-2000'])
  })

  it('keeps the same order whatever the input order', () => {
    const shipments = [
      buildShipmentWithException('SH-A', 'incident', '2026-10-20T08:00:00.000Z'),
      buildShipmentWithException('SH-B', 'customsHold', '2026-10-20T08:00:00.000Z'),
      buildShipmentWithException('SH-C', 'incident', '2026-10-19T08:00:00.000Z'),
    ]

    expect(listIds([...shipments].reverse())).toEqual(listIds(shipments))
    expect(listIds(shipments)).toEqual(['SH-B', 'SH-C', 'SH-A'])
  })

  it('lists every exception of a shipment with several', () => {
    const base = getSeedShipment('SH-1042')
    const shipment: Shipment = {
      ...base,
      exceptions: [
        { ...base.exceptions[0], id: 'X-stale', type: 'staleTracking' },
        { ...base.exceptions[0], id: 'X-customs', type: 'customsHold' },
      ],
    }

    const entries = listExceptionsByUrgency([shipment])

    expect(entries.map(entry => entry.exception.id)).toEqual(['X-customs', 'X-stale'])
  })

  it('orders the seeded ops inbox as SH-1042, SH-1051, SH-1037, SH-1035, SH-1029', () => {
    const { shipments, sites } = createSeed()
    const opsShipments = scopeShipments(shipments, { role: 'ops' }, sites)

    expect(listIds(opsShipments)).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
  })
})
