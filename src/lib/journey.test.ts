import { createSeed } from '@/api/seed'
import type { Milestone, Shipment } from '@/api/types'
import { buildJourney } from '@/lib/journey'

const NOW = new Date('2026-10-20T10:00:00.000Z')

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

type DerivedMilestoneFields = Pick<Milestone, 'id' | 'legId' | 'status' | 'location' | 'occurredAt'>

function buildDerivedMilestone(fields: DerivedMilestoneFields): Milestone {
  return { source: 'derived', receivedAt: fields.occurredAt, ...fields }
}

function summarise(shipment: Shipment): string[] {
  return buildJourney(shipment, NOW).map(step => `${step.position}|${step.place}|${step.state}|${step.status}`)
}

describe('buildJourney', () => {
  it('turns the port into the problem step on a customs hold', () => {
    const shipment = getSeedShipment('SH-1042')

    const steps = buildJourney(shipment, NOW)

    expect(summarise(shipment)).toEqual([
      'origin|Zaragoza plant|done|pickedUp',
      'legEndpoint|Bilbao port|done|departed',
      'legEndpoint|Southampton port|problem|customsHold',
      'destination|Birmingham|upcoming|null',
    ])
    expect(steps[2]?.date).toEqual({ kind: 'occurred', at: '2026-10-19T08:00:00.000Z' })
    expect(steps[2]?.rawEventIds).toEqual(['SH-1042-E5', 'SH-1042-E6'])
  })

  it('shows the carrier ETA on the final step when the estimate is in line', () => {
    const shipment = getSeedShipment('SH-1033')

    const steps = buildJourney(shipment, NOW)

    expect(steps.at(-1)?.date).toEqual({ kind: 'carrierEta', at: '2026-10-21T04:00:00.000Z' })
    expect(steps.at(-1)?.provenance).toEqual({ kind: 'carrierEta' })
  })

  it('shows our estimate with its confidence when it deviates from the carrier ETA', () => {
    const shipment = getSeedShipment('SH-1042')

    const finalStep = buildJourney(shipment, NOW).at(-1)

    expect(finalStep?.date).toEqual({ kind: 'estimate', estimate: shipment.estimatedEta })
    expect(finalStep?.provenance).toEqual({ kind: 'estimated', confidence: shipment.estimatedEta.confidence })
  })

  it('shows our estimate when the carrier gave no ETA', () => {
    const shipment = getSeedShipment('SH-1044')

    const finalStep = buildJourney(shipment, NOW).at(-1)

    expect(finalStep?.date.kind).toBe('estimate')
    expect(finalStep?.provenance.kind).toBe('estimated')
  })

  it('marks every step and connector done on a delivered shipment and drops intermediate milestones', () => {
    const shipment = getSeedShipment('SH-1009')

    const steps = buildJourney(shipment, NOW)

    expect(summarise(shipment)).toEqual([
      'origin|Zaragoza plant|done|pickedUp',
      'destination|Nordwerk GmbH, Hamburg|done|delivered',
    ])
    expect(steps[0]?.connectorToNext).toEqual({ legId: 'SH-1009-L1', carrierId: 'transauto', mode: 'road', state: 'done' })
    expect(steps[1]?.connectorToNext).toBeNull()
  })

  it('keeps passed places without milestones as done steps with no date on a delivered multi-leg shipment', () => {
    const customsShipment = getSeedShipment('SH-1042')
    const shipment: Shipment = {
      ...customsShipment,
      milestones: [
        ...customsShipment.milestones.slice(0, 1),
        {
          id: 'SH-1042-M9',
          legId: 'SH-1042-L3',
          status: 'delivered',
          location: 'Nordwerk UK Ltd, Birmingham',
          occurredAt: '2026-10-20T09:00:00.000Z',
          receivedAt: '2026-10-20T09:05:00.000Z',
          source: 'carrier',
          rawEventIds: ['SH-1042-E9'],
        },
      ],
    }

    const steps = buildJourney(shipment, NOW)

    expect(steps.map(step => step.state)).toEqual(['done', 'done', 'done', 'done'])
    expect(steps[1]?.date).toEqual({ kind: 'none' })
    expect(steps[3]?.place).toBe('Nordwerk UK Ltd, Birmingham')
    expect(steps.map(step => step.connectorToNext?.state ?? null)).toEqual(['done', 'done', 'done', null])
  })

  it('adds a derived mid-leg step flagged as derived from GPS', () => {
    const baseShipment = getSeedShipment('SH-1033')
    const shipment: Shipment = {
      ...baseShipment,
      milestones: [
        ...baseShipment.milestones,
        buildDerivedMilestone({
          id: 'SH-1033-M4',
          legId: 'SH-1033-L1',
          status: 'inTransit',
          location: 'Near Lyon',
          occurredAt: '2026-10-20T09:45:00.000Z',
        }),
      ],
    }

    const steps = buildJourney(shipment, NOW)

    expect(summarise(shipment)).toEqual([
      'origin|Zaragoza plant|done|pickedUp',
      'midLeg|Near Lyon|done|inTransit',
      'destination|Basel|upcoming|null',
    ])
    expect(steps[1]?.provenance).toEqual({ kind: 'derivedFromGps' })
    expect(steps[1]?.rawEventIds).toEqual([])
    expect(steps[0]?.connectorToNext?.state).toBe('done')
    expect(steps[1]?.connectorToNext?.state).toBe('upcoming')
  })

  it('keeps only the latest mid-leg milestone as a step', () => {
    const shipment = getSeedShipment('SH-1033')

    const steps = buildJourney(shipment, NOW)

    expect(summarise(shipment)).toEqual([
      'origin|Zaragoza plant|done|pickedUp',
      'midLeg|A-9 near Nîmes|done|inTransit',
      'destination|Basel|upcoming|null',
    ])
    expect(steps[1]?.provenance).toEqual({ kind: 'none' })
  })

  it('shows a delayed mid-leg milestone as the problem step', () => {
    const shipment = getSeedShipment('SH-1037')

    const steps = buildJourney(shipment, NOW)

    expect(steps.map(step => step.state)).toEqual(['done', 'problem', 'upcoming'])
    expect(steps[1]?.provenance).toEqual({ kind: 'derivedFromGps' })
  })

  it('keeps sea legs and later places upcoming with the planned date, the vessel and grey connectors', () => {
    const shipment = getSeedShipment('SH-1060')

    const steps = buildJourney(shipment, NOW)

    expect(summarise(shipment)).toEqual([
      'origin|Bilbao plant|done|pickedUp',
      'legEndpoint|Bilbao port|done|arrived',
      'legEndpoint|Le Havre port|upcoming|null',
      'destination|Le Havre|upcoming|null',
    ])
    expect(steps[1]?.connectorToNext).toEqual({
      legId: 'SH-1060-L2',
      carrierId: 'mareline',
      mode: 'sea',
      vessel: expect.any(String),
      state: 'upcoming',
    })
    expect(steps[2]?.date).toEqual({ kind: 'planned', at: '2026-10-22T04:00:00.000Z' })
    expect(steps[2]?.provenance).toEqual({ kind: 'estimated' })
  })

  it('does not treat an arrival reported before the sea leg departs as reaching the next port', () => {
    const shipment = getSeedShipment('SH-1047')

    const steps = buildJourney(shipment, NOW)

    expect(steps.map(step => step.state)).toEqual(['done', 'done', 'upcoming', 'upcoming'])
  })

  it('shows only the origin as done and the rest upcoming on a booked-only shipment', () => {
    const shipment = getSeedShipment('SH-1066')

    const steps = buildJourney(shipment, NOW)

    expect(summarise(shipment)).toEqual([
      'origin|Barcelona warehouse|done|booked',
      'destination|Zurich|upcoming|null',
    ])
    expect(steps[0]?.connectorToNext?.state).toBe('upcoming')
  })

  it('shows a future intermediate step as overdue when its planned date has passed', () => {
    const shipment = getSeedShipment('SH-1060')

    const steps = buildJourney(shipment, new Date('2026-10-22T06:00:00.000Z'))

    expect(steps[2]?.date).toEqual({ kind: 'overdue', plannedAt: '2026-10-22T04:00:00.000Z' })
  })

  it('shows a rolled vessel as the problem mid-leg step', () => {
    const baseShipment = getSeedShipment('SH-1060')
    const shipment: Shipment = {
      ...baseShipment,
      milestones: [
        ...baseShipment.milestones,
        buildDerivedMilestone({
          id: 'SH-1060-M9',
          legId: 'SH-1060-L2',
          status: 'vesselRolled',
          location: 'Bilbao port',
          occurredAt: '2026-10-20T09:00:00.000Z',
        }),
      ],
    }

    const steps = buildJourney(shipment, NOW)

    expect(steps.map(step => `${step.position}|${step.state}`)).toEqual([
      'origin|done',
      'legEndpoint|done',
      'midLeg|problem',
      'legEndpoint|upcoming',
      'destination|upcoming',
    ])
  })

  it('shows out for delivery as a done mid-leg step and keeps the final step upcoming', () => {
    const shipment = getSeedShipment('SH-1009')
    const outForDelivery = shipment.milestones.filter(milestone => milestone.status !== 'delivered')

    const steps = buildJourney({ ...shipment, milestones: outForDelivery }, NOW)

    expect(steps.map(step => step.state)).toEqual(['done', 'done', 'upcoming'])
    expect(steps.map(step => step.status)).toEqual(['pickedUp', 'outForDelivery', null])
    expect(steps.map(step => step.position)).toEqual(['origin', 'midLeg', 'destination'])
  })
})
