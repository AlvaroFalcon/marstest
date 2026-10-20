import {
  createSeed,
  createSimulatedCarrierEvent,
  DEMO_NOW_ISO,
  SIMULATED_EVENT_ID,
  SIMULATED_EVENT_SEQUENCE,
  SIMULATED_EVENT_SHIPMENT_ID,
  SIMULATED_EXCEPTION_ID,
  SIMULATED_MILESTONE_ID,
} from '@/api/seed'
import { demoStateSchema, shipmentSchema } from '@/api/types'
import type { DemoState, Shipment } from '@/api/types'

const HOUR_MS = 3_600_000

function shipmentById(state: DemoState, shipmentId: string): Shipment {
  const shipment = state.shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Missing ${shipmentId} in the seed`)
  }
  return shipment
}

function hoursBetween(fromIsoDate: string, toIsoDate: string): number {
  return (new Date(toIsoDate).getTime() - new Date(fromIsoDate).getTime()) / HOUR_MS
}

describe('createSeed', () => {
  it('has 18 shipments, 3 customers, 3 in-scope sites plus 1 out of scope and 5 carriers', () => {
    const demoNow = new Date(DEMO_NOW_ISO)

    const seed = createSeed(demoNow)

    expect(seed.shipments).toHaveLength(18)
    expect(seed.customers.map(customer => customer.name)).toEqual(['Nordwerk GmbH', 'Brenner Iberia S.L.', 'Alpen Werkzeug AG'])
    expect(seed.sites.filter(site => site.inOpsScope).map(site => site.name)).toEqual(['Zaragoza plant', 'Bilbao plant', 'Barcelona warehouse'])
    expect(seed.sites.filter(site => !site.inOpsScope).map(site => site.name)).toEqual(['Lyon warehouse'])
    expect(seed.carriers.map(carrier => carrier.name)).toEqual(['Transauto', 'Mareline', 'EuroRuta', 'Vascor Trans', 'Nordsee Line'])
  })

  it('passes the zod schemas for the whole state and every shipment', () => {
    const seed = createSeed()

    const stateResult = demoStateSchema.safeParse(seed)
    const shipmentErrors = seed.shipments.map(shipment => [shipment.id, shipmentSchema.safeParse(shipment).error])

    expect(stateResult.error).toBeUndefined()
    expect(shipmentErrors).toEqual(seed.shipments.map(shipment => [shipment.id, undefined]))
  })

  it('uses unique shipment ids and only references existing customers, sites, carriers and events', () => {
    const seed = createSeed()
    const customerIds = new Set(seed.customers.map(customer => customer.id))
    const siteIds = new Set(seed.sites.map(site => site.id))
    const carrierIds = new Set(seed.carriers.map(carrier => carrier.id))

    const danglingReferences = seed.shipments.flatMap((shipment) => {
      const rawEventIds = new Set(shipment.rawEvents.map(rawEvent => rawEvent.id))
      const legIds = new Set(shipment.legs.map(leg => leg.id))
      const referencedEventIds = [
        ...shipment.milestones.flatMap(milestone => (milestone.source === 'carrier' ? milestone.rawEventIds : [])),
        ...shipment.exceptions.flatMap(exception => exception.aiDiagnosis.basedOnEventIds),
      ]
      return [
        ...(customerIds.has(shipment.customerId) ? [] : [shipment.customerId]),
        ...(siteIds.has(shipment.originSiteId) ? [] : [shipment.originSiteId]),
        ...shipment.legs.map(leg => leg.carrierId).filter(carrierId => !carrierIds.has(carrierId)),
        ...shipment.rawEvents.map(rawEvent => rawEvent.carrierId).filter(carrierId => !carrierIds.has(carrierId)),
        ...shipment.milestones.map(milestone => milestone.legId).filter(legId => !legIds.has(legId)),
        ...referencedEventIds.filter(eventId => !rawEventIds.has(eventId)),
      ]
    })

    expect(new Set(seed.shipments.map(shipment => shipment.id)).size).toBe(18)
    expect(danglingReferences).toEqual([])
  })

  it('assigns every leg to a carrier of the same transport mode', () => {
    const seed = createSeed()
    const carrierModes = new Map(seed.carriers.map(carrier => [carrier.id, carrier.mode]))

    const mismatchedLegs = seed.shipments
      .flatMap(shipment => shipment.legs)
      .filter(leg => carrierModes.get(leg.carrierId) !== leg.mode)
      .map(leg => leg.id)

    expect(mismatchedLegs).toEqual([])
  })

  it('gives every shipment at least one raw carrier event', () => {
    const seed = createSeed()

    const shipmentsWithoutEvents = seed.shipments
      .filter(shipment => shipment.rawEvents.length === 0)
      .map(shipment => shipment.id)

    expect(shipmentsWithoutEvents).toEqual([])
  })

  it('covers the customs hold on SH-1042 with a missing certificate of origin and an HS code mismatch', () => {
    const shipment = shipmentById(createSeed(), 'SH-1042')

    const documentTypes = shipment.documents.map(document => document.type)
    const invoice = shipment.documents.find(document => document.type === 'commercialInvoice')

    expect(shipment.exceptions.map(exception => exception.type)).toEqual(['customsHold'])
    expect(shipment.erpOrder.requiredDocuments).toContain('certificateOfOrigin')
    expect(documentTypes).not.toContain('certificateOfOrigin')
    expect(invoice).toMatchObject({ status: 'received', extracted: { hsCode: '8467.29' } })
    expect(shipment.erpOrder.hsCode).toBe('8467.21')
    expect(shipment.exceptions[0].aiDiagnosis.summary).toContain('Demurrage')
  })

  it('opens the expected exception on each seeded exception scenario', () => {
    const seed = createSeed()

    const exceptionTypes = Object.fromEntries(
      ['SH-1037', 'SH-1029', 'SH-1051', 'SH-1035'].map(shipmentId => [
        shipmentId,
        shipmentById(seed, shipmentId).exceptions.map(exception => exception.type),
      ]),
    )

    expect(exceptionTypes).toEqual({
      'SH-1037': ['predictedDelay'],
      'SH-1029': ['staleTracking'],
      'SH-1051': ['incident'],
      'SH-1035': ['predictedDelay'],
    })
  })

  it('starts SH-1060 on track so the simulated event provides the rolled-vessel scenario', () => {
    const shipment = shipmentById(createSeed(), 'SH-1060')

    const statuses = shipment.milestones.map(milestone => milestone.status)

    expect(SIMULATED_EVENT_SHIPMENT_ID).toBe('SH-1060')
    expect(statuses).not.toContain('vesselRolled')
    expect(shipment.exceptions).toEqual([])
    expect(shipment.legs[1]).toMatchObject({ mode: 'sea', carrierId: 'mareline', vessel: 'Mareline Levante', voyage: 'ML-0842' })
  })

  it('derives the simulated event ids from the next free positions of the SH-1060 seed', () => {
    const shipment = shipmentById(createSeed(), SIMULATED_EVENT_SHIPMENT_ID)

    const nextRawEventSequence = shipment.rawEvents.length + 1
    const nextMilestoneSequence = shipment.milestones.length + 1
    const nextExceptionSequence = shipment.exceptions.length + 1

    expect(nextRawEventSequence).toBe(SIMULATED_EVENT_SEQUENCE)
    expect(nextMilestoneSequence).toBe(SIMULATED_EVENT_SEQUENCE)
    expect(SIMULATED_EVENT_ID).toBe(`SH-1060-E${nextRawEventSequence}`)
    expect(SIMULATED_MILESTONE_ID).toBe(`SH-1060-M${nextMilestoneSequence}`)
    expect(SIMULATED_EXCEPTION_ID).toBe(`SH-1060-X${nextExceptionSequence}`)
  })

  it('leaves the last carrier message of SH-1029 48 h old', () => {
    const shipment = shipmentById(createSeed(), 'SH-1029')

    const lastReceivedAt = shipment.rawEvents.map(rawEvent => rawEvent.receivedAt).sort().at(-1) ?? ''

    expect(hoursBetween(DEMO_NOW_ISO, lastReceivedAt)).toBe(-48)
  })

  it('covers on track, suspected 58 % and predicted 92 % delay states', () => {
    const seed = createSeed()
    const onTrack = shipmentById(seed, 'SH-1033')
    const suspected = shipmentById(seed, 'SH-1034')
    const predicted = shipmentById(seed, 'SH-1035')

    const predictedCarrierEta = predicted.carrierEta.status === 'provided' ? predicted.carrierEta.date : ''

    expect(onTrack.carrierEta).toMatchObject({ status: 'provided', date: onTrack.estimatedEta.date })
    expect(onTrack.exceptions).toEqual([])
    expect(suspected.estimatedEta.confidence).toBe(58)
    expect(suspected.exceptions).toEqual([])
    expect(predicted.estimatedEta.confidence).toBe(92)
    expect(predicted.exceptions).toHaveLength(1)
    expect(hoursBetween(predictedCarrierEta, predicted.estimatedEta.date)).toBe(10)
  })

  it('has no carrier ETA on SH-1044 and delivers SH-1009 one day earlier than planned', () => {
    const seed = createSeed()
    const noCarrierEta = shipmentById(seed, 'SH-1044')
    const delivered = shipmentById(seed, 'SH-1009')

    const deliveredMilestone = delivered.milestones.find(milestone => milestone.status === 'delivered')

    expect(noCarrierEta.carrierEta).toEqual({ status: 'notProvided' })
    expect(hoursBetween(delivered.plannedDeliveryAt, deliveredMilestone?.occurredAt ?? '')).toBe(-24)
    expect(delivered.documents.map(document => document.type)).toContain('proofOfDelivery')
  })

  it('includes rule-mapped, AI-mapped at 91 % and low-confidence 54 % raw events', () => {
    const rawEvents = createSeed().shipments.flatMap(shipment => shipment.rawEvents)

    const aiConfidences = rawEvents.flatMap(rawEvent => (rawEvent.mapping.method === 'ai' ? [rawEvent.mapping.confidence] : []))

    expect(rawEvents.some(rawEvent => rawEvent.mapping.method === 'rule')).toBe(true)
    expect(aiConfidences).toContain(91)
    expect(aiConfidences).toContain(54)
  })

  it('dates everything relative to the injected demo time', () => {
    const demoNow = new Date('2027-03-01T08:00:00.000Z')

    const shipment = shipmentById(createSeed(demoNow), 'SH-1033')

    expect(shipment.carrierEta).toMatchObject({ status: 'provided', date: '2027-03-02T02:00:00.000Z' })
  })

  it('returns a new object on every call', () => {
    const first = createSeed()

    first.customers[0].name = 'Changed'
    const second = createSeed()

    expect(second.customers[0].name).toBe('Nordwerk GmbH')
  })
})

describe('createSimulatedCarrierEvent', () => {
  it('builds a vessel-rolled event for SH-1060 received at the given time', () => {
    const receivedAt = new Date('2026-10-20T10:15:00.000Z')

    const event = createSimulatedCarrierEvent(receivedAt)

    expect(event.rawEvent).toMatchObject({ id: 'SH-1060-E4', receivedAt: '2026-10-20T10:15:00.000Z' })
    expect(event.milestone).toMatchObject({ id: 'SH-1060-M4', status: 'vesselRolled' })
    expect(event.exception).toMatchObject({ id: 'SH-1060-X1', type: 'vesselRolled', draft: { status: 'pending' } })
    expect(event.exception.draft).toMatchObject({ body: expect.stringContaining('Brenner Iberia') })
    expect(event.exception.draft).toMatchObject({ body: expect.stringContaining('PO 4500-1203') })
    expect(event.legs[1]).toMatchObject({ vessel: 'Mareline Poniente', voyage: 'ML-0846' })
  })
})
