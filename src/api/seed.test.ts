import { createSeed, createSimulatedCarrierEvent, DEMO_NOW } from '@/api/seed'
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

function hoursBetween(from: Date, isoDate: string): number {
  return (new Date(isoDate).getTime() - from.getTime()) / HOUR_MS
}

describe('createSeed', () => {
  it('has 18 shipments, 3 customers, 3 in-scope sites plus 1 out of scope and 5 carriers', () => {
    // Arrange
    const demoNow = DEMO_NOW

    // Act
    const seed = createSeed(demoNow)

    // Assert
    expect(seed.shipments).toHaveLength(18)
    expect(seed.customers.map(customer => customer.name)).toEqual(['Nordwerk GmbH', 'Brenner Iberia S.L.', 'Alpen Werkzeug AG'])
    expect(seed.sites.filter(site => site.inOpsScope).map(site => site.name)).toEqual(['Zaragoza plant', 'Bilbao plant', 'Barcelona warehouse'])
    expect(seed.sites.filter(site => !site.inOpsScope).map(site => site.name)).toEqual(['Lyon warehouse'])
    expect(seed.carriers.map(carrier => carrier.name)).toEqual(['Transauto', 'Mareline', 'EuroRuta', 'Vascor Trans', 'Nordsee Line'])
  })

  it('passes the zod schemas for the whole state and every shipment', () => {
    // Arrange
    const seed = createSeed()

    // Act
    const stateResult = demoStateSchema.safeParse(seed)
    const shipmentErrors = seed.shipments.map(shipment => [shipment.id, shipmentSchema.safeParse(shipment).error])

    // Assert
    expect(stateResult.error).toBeUndefined()
    expect(shipmentErrors).toEqual(seed.shipments.map(shipment => [shipment.id, undefined]))
  })

  it('uses unique shipment ids and only references existing customers, sites, carriers and events', () => {
    // Arrange
    const seed = createSeed()
    const customerIds = new Set(seed.customers.map(customer => customer.id))
    const siteIds = new Set(seed.sites.map(site => site.id))
    const carrierIds = new Set(seed.carriers.map(carrier => carrier.id))

    // Act
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

    // Assert
    expect(new Set(seed.shipments.map(shipment => shipment.id)).size).toBe(18)
    expect(danglingReferences).toEqual([])
  })

  it('covers the customs hold on SH-1042 with a missing certificate of origin and an HS code mismatch', () => {
    // Arrange
    const shipment = shipmentById(createSeed(), 'SH-1042')

    // Act
    const documentTypes = shipment.documents.map(document => document.type)
    const invoice = shipment.documents.find(document => document.type === 'commercialInvoice')

    // Assert
    expect(shipment.exceptions.map(exception => exception.type)).toEqual(['customsHold'])
    expect(shipment.erpOrder.requiredDocuments).toContain('certificateOfOrigin')
    expect(documentTypes).not.toContain('certificateOfOrigin')
    expect(invoice?.status === 'received' && invoice.extracted.hsCode).toBe('8467.29')
    expect(shipment.erpOrder.hsCode).toBe('8467.21')
    expect(shipment.exceptions[0]?.aiDiagnosis.summary).toContain('Demurrage')
  })

  it('opens the expected exception on each exception scenario', () => {
    // Arrange
    const seed = createSeed()

    // Act
    const exceptionTypes = Object.fromEntries(
      ['SH-1060', 'SH-1037', 'SH-1029', 'SH-1051', 'SH-1035'].map(shipmentId => [
        shipmentId,
        shipmentById(seed, shipmentId).exceptions.map(exception => exception.type),
      ]),
    )

    // Assert
    expect(exceptionTypes).toEqual({
      'SH-1060': ['vesselRolled'],
      'SH-1037': ['predictedDelay'],
      'SH-1029': ['staleTracking'],
      'SH-1051': ['incident'],
      'SH-1035': ['predictedDelay'],
    })
  })

  it('leaves the last carrier message of SH-1029 48 h old', () => {
    // Arrange
    const shipment = shipmentById(createSeed(), 'SH-1029')

    // Act
    const lastReceivedAt = shipment.rawEvents.map(rawEvent => rawEvent.receivedAt).sort().at(-1) ?? ''

    // Assert
    expect(hoursBetween(DEMO_NOW, lastReceivedAt)).toBe(-48)
  })

  it('covers on track, suspected 58 % and predicted 92 % delay states', () => {
    // Arrange
    const seed = createSeed()
    const onTrack = shipmentById(seed, 'SH-1033')
    const suspected = shipmentById(seed, 'SH-1034')
    const predicted = shipmentById(seed, 'SH-1035')

    // Act
    const predictedCarrierEta = predicted.carrierEta.status === 'provided' ? predicted.carrierEta.date : ''

    // Assert
    expect(onTrack.carrierEta.status === 'provided' && onTrack.carrierEta.date).toBe(onTrack.estimatedEta.date)
    expect(onTrack.exceptions).toEqual([])
    expect(suspected.estimatedEta.confidence).toBe(58)
    expect(suspected.exceptions).toEqual([])
    expect(predicted.estimatedEta.confidence).toBe(92)
    expect(predicted.exceptions).toHaveLength(1)
    expect(hoursBetween(new Date(predictedCarrierEta), predicted.estimatedEta.date)).toBe(10)
  })

  it('has no carrier ETA on SH-1044 and delivers SH-1009 one day earlier than planned', () => {
    // Arrange
    const seed = createSeed()
    const noCarrierEta = shipmentById(seed, 'SH-1044')
    const delivered = shipmentById(seed, 'SH-1009')

    // Act
    const deliveredMilestone = delivered.milestones.find(milestone => milestone.status === 'delivered')

    // Assert
    expect(noCarrierEta.carrierEta).toEqual({ status: 'notProvided' })
    expect(hoursBetween(new Date(delivered.plannedDeliveryAt), deliveredMilestone?.occurredAt ?? '')).toBe(-24)
    expect(delivered.documents.map(document => document.type)).toContain('proofOfDelivery')
  })

  it('includes rule-mapped, AI-mapped at 91 % and low-confidence 54 % raw events', () => {
    // Arrange
    const rawEvents = createSeed().shipments.flatMap(shipment => shipment.rawEvents)

    // Act
    const aiConfidences = rawEvents.flatMap(rawEvent => (rawEvent.mapping.method === 'ai' ? [rawEvent.mapping.confidence] : []))

    // Assert
    expect(rawEvents.some(rawEvent => rawEvent.mapping.method === 'rule')).toBe(true)
    expect(aiConfidences).toContain(91)
    expect(aiConfidences).toContain(54)
    expect(createSeed().shipments.every(shipment => shipment.rawEvents.length > 0)).toBe(true)
  })

  it('dates everything relative to the injected demo time', () => {
    // Arrange
    const demoNow = new Date('2027-03-01T08:00:00.000Z')

    // Act
    const shipment = shipmentById(createSeed(demoNow), 'SH-1033')

    // Assert
    expect(shipment.carrierEta.status === 'provided' && shipment.carrierEta.date).toBe('2027-03-02T02:00:00.000Z')
  })

  it('returns a new object on every call', () => {
    // Arrange
    const first = createSeed()

    // Act
    first.customers[0].name = 'Changed'
    const second = createSeed()

    // Assert
    expect(second.customers[0]?.name).toBe('Nordwerk GmbH')
  })
})

describe('createSimulatedCarrierEvent', () => {
  it('builds a valid vessel-rolled event received at the given time', () => {
    // Arrange
    const receivedAt = new Date('2026-10-20T10:15:00.000Z')

    // Act
    const event = createSimulatedCarrierEvent(receivedAt)

    // Assert
    expect(event.rawEvent.receivedAt).toBe('2026-10-20T10:15:00.000Z')
    expect(event.milestone.status).toBe('vesselRolled')
    expect(event.exception.type).toBe('vesselRolled')
    expect(event.exception.draft.status).toBe('pending')
  })
})
