import type {
  Carrier,
  CarrierChannel,
  CarrierEta,
  Customer,
  DemoState,
  DocumentType,
  EstimatedEta,
  EventMapping,
  ExtractedDocumentFields,
  Leg,
  Milestone,
  MilestoneStatus,
  RawCarrierEvent,
  Shipment,
  ShipmentDocument,
  ShipmentException,
  Site,
} from '@/api/types'

/**
 * The moment the demo story happens. Every seeded date is relative to it, so the seed is
 * deterministic and tests can inject another value instead of reading the clock.
 */
export const DEMO_NOW_ISO = '2026-10-20T10:00:00.000Z'

const MILLISECONDS_PER_HOUR = 3_600_000
const MILLISECONDS_PER_MINUTE = 60_000

/** Minutes between a carrier event happening and us receiving it, unless a step says otherwise. */
const DEFAULT_REPORT_LAG_MINUTES = 5

/** Customers and subsidiaries available in the "Viewing as" switch. */
const customers: Customer[] = [
  { id: 'nordwerk', name: 'Nordwerk GmbH', city: 'Hamburg', countryCode: 'DE' },
  { id: 'brenner-iberia', name: 'Brenner Iberia S.L.', city: 'Madrid', countryCode: 'ES' },
  { id: 'alpen-werkzeug', name: 'Alpen Werkzeug AG', city: 'Zurich', countryCode: 'CH' },
]

/** Shipping sites. The three Spanish sites are the ops user's scope; Lyon is shown locked. */
const sites: Site[] = [
  { id: 'zaragoza-plant', name: 'Zaragoza plant', city: 'Zaragoza', countryCode: 'ES', inOpsScope: true },
  { id: 'bilbao-plant', name: 'Bilbao plant', city: 'Bilbao', countryCode: 'ES', inOpsScope: true },
  { id: 'barcelona-warehouse', name: 'Barcelona warehouse', city: 'Barcelona', countryCode: 'ES', inOpsScope: true },
  { id: 'lyon-warehouse', name: 'Lyon warehouse', city: 'Lyon', countryCode: 'FR', inOpsScope: false },
]

/** Road hauliers and ocean lines used by the seeded shipments. */
const carriers: Carrier[] = [
  { id: 'transauto', name: 'Transauto', mode: 'road' },
  { id: 'mareline', name: 'Mareline', mode: 'sea' },
  { id: 'euroruta', name: 'EuroRuta', mode: 'road' },
  { id: 'vascor-trans', name: 'Vascor Trans', mode: 'road' },
  { id: 'nordsee-line', name: 'Nordsee Line', mode: 'sea' },
]

/** Id of the shipment the "Simulate carrier event" demo action changes. */
export const SIMULATED_EVENT_SHIPMENT_ID = 'SH-1060'

/**
 * Position of the scripted step in the SH-1060 tracking: it follows the steps seeded on that
 * shipment. The raw event, milestone and exception ids below derive from it, and a seed test
 * checks it still matches the seeded array lengths.
 */
export const SIMULATED_EVENT_SEQUENCE = 4

/** Id of the scripted raw event, used to apply the simulation only once. */
export const SIMULATED_EVENT_ID = `${SIMULATED_EVENT_SHIPMENT_ID}-E${SIMULATED_EVENT_SEQUENCE}`

/** Id of the milestone the scripted event creates. */
export const SIMULATED_MILESTONE_ID = `${SIMULATED_EVENT_SHIPMENT_ID}-M${SIMULATED_EVENT_SEQUENCE}`

/** Id of the exception the scripted event opens: the first one on a shipment seeded without any. */
export const SIMULATED_EXCEPTION_ID = `${SIMULATED_EVENT_SHIPMENT_ID}-X1`

/** Returns a function that turns an offset in hours from `demoNow` into an ISO date. */
function createClock(demoNow: Date): (hoursFromNow: number) => string {
  return hoursFromNow => new Date(demoNow.getTime() + hoursFromNow * MILLISECONDS_PER_HOUR).toISOString()
}

/** Returns `isoDate` moved forward by `minutes`. */
function addMinutes(isoDate: string, minutes: number): string {
  return new Date(new Date(isoDate).getTime() + minutes * MILLISECONDS_PER_MINUTE).toISOString()
}

/** Mapping done by a deterministic rule; `name` is the rule shown in the source events panel. */
function rule(name: string): EventMapping {
  return { method: 'rule', rule: name }
}

/** Mapping done by the simulated AI with the given confidence percentage. */
function ai(confidence: number): EventMapping {
  return { method: 'ai', confidence }
}

/** A carrier message that becomes one milestone. `occurredAt` is an ISO date. */
type CarrierStep = {
  kind: 'carrier'
  legId: string
  status: MilestoneStatus
  location: string
  occurredAt: string
  channel: CarrierChannel
  rawText: string
  mapping: EventMapping
  reportLagMinutes?: number
}

/** A system insight with no carrier message behind it ("Derived from GPS"). */
type DerivedStep = {
  kind: 'derived'
  legId: string
  status: MilestoneStatus
  location: string
  occurredAt: string
}

type TrackingStep = CarrierStep | DerivedStep

type Tracking = {
  milestones: Milestone[]
  rawEvents: RawCarrierEvent[]
}

/**
 * Builds the milestones and raw events of a shipment from a chronological list of steps, so each
 * seeded carrier message and its normalised milestone are written once and cannot disagree.
 * Raw events are numbered `<shipmentId>-E<n>` and milestones `<shipmentId>-M<n>`.
 */
function buildTracking(shipmentId: string, legs: Leg[], steps: TrackingStep[]): Tracking {
  const milestones: Milestone[] = []
  const rawEvents: RawCarrierEvent[] = []

  steps.forEach((step, stepIndex) => {
    const milestoneId = `${shipmentId}-M${stepIndex + 1}`
    if (step.kind === 'derived') {
      milestones.push({
        id: milestoneId,
        legId: step.legId,
        status: step.status,
        location: step.location,
        occurredAt: step.occurredAt,
        receivedAt: step.occurredAt,
        source: 'derived',
      })
      return
    }

    const leg = legs.find(candidate => candidate.id === step.legId)
    if (!leg) {
      throw new Error(`Seed error: leg ${step.legId} does not exist on ${shipmentId}`)
    }
    const rawEventId = `${shipmentId}-E${rawEvents.length + 1}`
    const receivedAt = addMinutes(step.occurredAt, step.reportLagMinutes ?? DEFAULT_REPORT_LAG_MINUTES)
    rawEvents.push({
      id: rawEventId,
      carrierId: leg.carrierId,
      channel: step.channel,
      receivedAt,
      rawText: step.rawText,
      normalizedStatus: step.status,
      mapping: step.mapping,
    })
    milestones.push({
      id: milestoneId,
      legId: step.legId,
      status: step.status,
      location: step.location,
      occurredAt: step.occurredAt,
      receivedAt,
      source: 'carrier',
      rawEventIds: [rawEventId],
    })
  })

  return { milestones, rawEvents }
}

/** A document that has been received, with the fields extracted from it. */
function receivedDocument(
  shipmentId: string,
  type: DocumentType,
  receivedAt: string,
  extracted: ExtractedDocumentFields = {},
): ShipmentDocument {
  return {
    id: `${shipmentId}-${type}`,
    type,
    status: 'received',
    fileName: `${shipmentId}-${type}.pdf`,
    receivedAt,
    extracted,
  }
}

/** A document that is expected but not received yet. */
function pendingDocument(shipmentId: string, type: DocumentType): ShipmentDocument {
  return { id: `${shipmentId}-${type}`, type, status: 'pending' }
}

/** Carrier ETA reported through `channel`, last updated at `updatedAt`. */
function providedEta(date: string, carrierId: string, channel: CarrierChannel, updatedAt: string): CarrierEta {
  return { status: 'provided', date, source: { carrierId, channel }, updatedAt }
}

/** Documents of an intra-EU road shipment, all received at `receivedAt`. */
function euRoadDocuments(shipmentId: string, receivedAt: string, hsCode: string, grossWeightKg: number): ShipmentDocument[] {
  return [
    receivedDocument(shipmentId, 'commercialInvoice', receivedAt, { hsCode, grossWeightKg }),
    receivedDocument(shipmentId, 'packingList', receivedAt, { grossWeightKg }),
    receivedDocument(shipmentId, 'cmr', receivedAt, { grossWeightKg }),
  ]
}

const EU_ROAD_DOCUMENTS: DocumentType[] = ['commercialInvoice', 'packingList', 'cmr']
const SWISS_ROAD_DOCUMENTS: DocumentType[] = [...EU_ROAD_DOCUMENTS, 'certificateOfOrigin', 'customsDeclaration']

/** Documents of a road shipment into Switzerland, all received at `receivedAt`. */
function swissRoadDocuments(shipmentId: string, receivedAt: string, hsCode: string, grossWeightKg: number): ShipmentDocument[] {
  return [
    ...euRoadDocuments(shipmentId, receivedAt, hsCode, grossWeightKg),
    receivedDocument(shipmentId, 'certificateOfOrigin', receivedAt, { hsCode }),
    receivedDocument(shipmentId, 'customsDeclaration', receivedAt, { hsCode, grossWeightKg }),
  ]
}

/** SH-1042 · customs hold at Southampton: missing certificate of origin, HS code mismatch, demurrage. */
function customsHoldShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1042'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'transauto', origin: 'Zaragoza plant', destination: 'Bilbao port', plannedDepartureAt: at(-150), plannedArrivalAt: at(-142) },
    { id: `${id}-L2`, mode: 'sea', carrierId: 'nordsee-line', origin: 'Bilbao port', destination: 'Southampton port', plannedDepartureAt: at(-120), plannedArrivalAt: at(-30), vessel: 'Nordsee Aurora', voyage: 'NA-2641' },
    { id: `${id}-L3`, mode: 'road', carrierId: 'transauto', origin: 'Southampton port', destination: 'Birmingham', plannedDepartureAt: at(-24), plannedArrivalAt: at(8) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-150), channel: 'api', rawText: 'PICKUP CONFIRMED ZARAGOZA PLANT', mapping: rule('PICKUP CONFIRMED → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'arrived', location: 'Bilbao port', occurredAt: at(-142), channel: 'api', rawText: 'DELIVERED TO TERMINAL BILBAO', mapping: rule('DELIVERED TO TERMINAL → Arrived') },
    { kind: 'carrier', legId: `${id}-L2`, status: 'loadedOnVessel', location: 'Bilbao port', occurredAt: at(-121), channel: 'edi', rawText: 'IFTSTA LOADED ON BOARD NORDSEE AURORA NA-2641', mapping: rule('IFTSTA LOADED ON BOARD → Loaded on vessel') },
    { kind: 'carrier', legId: `${id}-L2`, status: 'departed', location: 'Bilbao port', occurredAt: at(-120), channel: 'edi', rawText: 'IFTSTA VESSEL DEPARTURE BILBAO', mapping: rule('IFTSTA VESSEL DEPARTURE → Departed') },
    { kind: 'carrier', legId: `${id}-L2`, status: 'arrived', location: 'Southampton port', occurredAt: at(-30), channel: 'edi', rawText: 'IFTSTA DISCHARGED SOUTHAMPTON', mapping: rule('IFTSTA DISCHARGED → Arrived') },
    { kind: 'carrier', legId: `${id}-L2`, status: 'customsHold', location: 'Southampton port', occurredAt: at(-26), channel: 'email', rawText: 'Box NSLU 482913 held by HMRC pending CoO, docs team pls advise', mapping: ai(91), reportLagMinutes: 20 },
  ])
  const exception: ShipmentException = {
    id: `${id}-X1`,
    type: 'customsHold',
    openedAt: at(-25.5),
    aiDiagnosis: {
      summary: 'UK customs is holding the container at Southampton. The certificate of origin is missing and the HS code on the commercial invoice (8467.29) does not match the ERP order (8467.21). Demurrage charges start tomorrow evening if the container is not released.',
      basedOnEventIds: [`${id}-E5`, `${id}-E6`],
    },
    draft: {
      status: 'pending',
      body: 'Hello Nordwerk team, your shipment SH-1042 (PO 4500-1187) is held by UK customs at Southampton because a document is missing. We are providing it today and now expect delivery about two days later than planned. We will update you as soon as the container is released.',
    },
  }

  return {
    id,
    customerId: 'nordwerk',
    originSiteId: 'zaragoza-plant',
    destination: { name: 'Nordwerk UK Ltd', city: 'Birmingham', countryCode: 'GB' },
    cargo: 'Cordless drill assemblies, 6 pallets',
    bookedAt: at(-170),
    plannedDeliveryAt: at(8),
    erpOrder: {
      poNumber: '4500-1187',
      hsCode: '8467.21',
      grossWeightKg: 1840,
      requiredDocuments: ['commercialInvoice', 'packingList', 'billOfLading', 'certificateOfOrigin', 'customsDeclaration'],
    },
    legs,
    ...tracking,
    carrierEta: providedEta(at(8), 'nordsee-line', 'edi', at(-0.2)),
    estimatedEta: {
      date: at(56),
      earliest: at(44),
      latest: at(72),
      confidence: 81,
      reason: 'Held by UK customs until the certificate of origin and a corrected invoice are provided; similar holds took about 2 days to release.',
    },
    documents: [
      receivedDocument(id, 'commercialInvoice', at(-150), { hsCode: '8467.29', grossWeightKg: 1840 }),
      receivedDocument(id, 'packingList', at(-150), { grossWeightKg: 1840 }),
      receivedDocument(id, 'billOfLading', at(-119), { grossWeightKg: 1840 }),
      receivedDocument(id, 'customsDeclaration', at(-32), { hsCode: '8467.29', grossWeightKg: 1840 }),
    ],
    exceptions: [exception],
  }
}

/** SH-1047 · sea shipment waiting at the Barcelona terminal, no carrier update for 20 h. */
function quietTerminalShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1047'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Zaragoza plant', destination: 'Barcelona port', plannedDepartureAt: at(-50), plannedArrivalAt: at(-44) },
    { id: `${id}-L2`, mode: 'sea', carrierId: 'mareline', origin: 'Barcelona port', destination: 'Genoa port', plannedDepartureAt: at(6), plannedArrivalAt: at(30), vessel: 'Mareline Tramontana', voyage: 'ML-0839' },
    { id: `${id}-L3`, mode: 'road', carrierId: 'euroruta', origin: 'Genoa port', destination: 'Zurich', plannedDepartureAt: at(34), plannedArrivalAt: at(44) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-50), channel: 'api', rawText: 'PICKED_UP', mapping: rule('PICKED_UP → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'arrived', location: 'Barcelona port', occurredAt: at(-44), channel: 'api', rawText: 'DELIVERED_TO_TERMINAL BARCELONA', mapping: rule('DELIVERED_TO_TERMINAL → Arrived') },
    { kind: 'carrier', legId: `${id}-L2`, status: 'arrived', location: 'Barcelona port terminal', occurredAt: at(-20), channel: 'edi', rawText: 'CODECO GATE IN FULL BARCELONA', mapping: rule('CODECO GATE IN → Arrived') },
  ])

  return {
    id,
    customerId: 'alpen-werkzeug',
    originSiteId: 'zaragoza-plant',
    destination: { name: 'Alpen Werkzeug AG', city: 'Zurich', countryCode: 'CH' },
    cargo: 'Pneumatic tool sets, 9 pallets',
    bookedAt: at(-80),
    plannedDeliveryAt: at(44),
    erpOrder: {
      poNumber: '4500-1185',
      hsCode: '8467.11',
      grossWeightKg: 2480,
      requiredDocuments: [...SWISS_ROAD_DOCUMENTS, 'billOfLading'],
    },
    legs,
    ...tracking,
    carrierEta: providedEta(at(44), 'mareline', 'edi', at(-20)),
    estimatedEta: {
      date: at(46),
      earliest: at(42),
      latest: at(52),
      confidence: 78,
      reason: 'The container entered the Barcelona terminal 20 h ago and Mareline Tramontana is on schedule; no update since.',
    },
    documents: [...swissRoadDocuments(id, at(-51), '8467.11', 2480), pendingDocument(id, 'billOfLading')],
    exceptions: [],
  }
}

/** SH-1037 · predicted delay at the Swiss border, exception opened. */
function predictedDelayShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1037'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Zaragoza plant', destination: 'Zurich', plannedDepartureAt: at(-40), plannedArrivalAt: at(6) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-40), channel: 'api', rawText: 'PICKED_UP', mapping: rule('PICKED_UP → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-2 near Lleida', occurredAt: at(-36), channel: 'api', rawText: 'IN_TRANSIT · POSITION A-2 LLEIDA', mapping: rule('IN_TRANSIT → In transit') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-36 near Mulhouse', occurredAt: at(-6), channel: 'api', rawText: 'IN_TRANSIT · POSITION A-36 MULHOUSE', mapping: rule('IN_TRANSIT → In transit') },
    { kind: 'derived', legId: `${id}-L1`, status: 'delayed', location: 'Basel border crossing', occurredAt: at(-2) },
  ])

  return {
    id,
    customerId: 'alpen-werkzeug',
    originSiteId: 'zaragoza-plant',
    destination: { name: 'Alpen Werkzeug AG', city: 'Zurich', countryCode: 'CH' },
    cargo: 'Milling cutters, 4 pallets',
    bookedAt: at(-60),
    plannedDeliveryAt: at(6),
    erpOrder: { poNumber: '4500-1171', hsCode: '8207.70', grossWeightKg: 1320, requiredDocuments: SWISS_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: providedEta(at(6), 'euroruta', 'api', at(-0.5)),
    estimatedEta: {
      date: at(20),
      earliest: at(16),
      latest: at(26),
      confidence: 84,
      reason: 'The truck has been stopped in the Basel border queue for 2 h, and EuroRuta trucks on this lane arrived 11 h late on average this month.',
    },
    documents: swissRoadDocuments(id, at(-41), '8207.70', 1320),
    aiSignal: {
      text: 'Delay very likely (~14 h). The truck has been in the Basel border queue for 2 h and EuroRuta trucks on this lane arrived 11 h late on average this month. The carrier ETA has not changed, so we keep showing it as reported.',
      evidenceLabel: 'Based on 12 GPS pings and 1 border-wait feed',
      basedOnEventIds: [`${id}-E2`, `${id}-E3`],
    },
    exceptions: [
      {
        id: `${id}-X1`,
        type: 'predictedDelay',
        openedAt: at(-1.5),
        aiDiagnosis: {
          summary: 'The truck is stopped at the Basel border crossing and the carrier ETA has not changed. Delivery to Zurich is likely about 14 h later than the carrier ETA.',
          basedOnEventIds: [`${id}-E2`, `${id}-E3`],
        },
        draft: {
          status: 'pending',
          body: 'Hello Alpen Werkzeug team, shipment SH-1037 (PO 4500-1171) is waiting at the Swiss border. We now expect delivery tomorrow morning instead of today. We will confirm once it has cleared the border.',
        },
      },
    ],
  }
}

/** SH-1029 · no carrier update for 48 h; the last message was mapped by AI with low confidence. */
function staleShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1029'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'vascor-trans', origin: 'Bilbao plant', destination: 'Seville', plannedDepartureAt: at(-60), plannedArrivalAt: at(4) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Bilbao plant', occurredAt: at(-60), channel: 'portal', rawText: 'Recogida realizada - Planta Bilbao', mapping: rule('Recogida realizada → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'Mérida', occurredAt: at(-48.5), channel: 'email', rawText: 'Camión parado en zona de espera, pendiente de turno de descarga', mapping: ai(54), reportLagMinutes: 30 },
  ])

  return {
    id,
    customerId: 'brenner-iberia',
    originSiteId: 'bilbao-plant',
    destination: { name: 'Brenner Iberia Sur', city: 'Seville', countryCode: 'ES' },
    cargo: 'Industrial valves, 3 pallets',
    bookedAt: at(-80),
    plannedDeliveryAt: at(4),
    erpOrder: { poNumber: '4500-1158', hsCode: '8481.80', grossWeightKg: 780, requiredDocuments: EU_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: providedEta(at(4), 'vascor-trans', 'portal', at(-48)),
    estimatedEta: {
      date: at(22),
      earliest: at(12),
      latest: at(36),
      confidence: 62,
      reason: 'No carrier update for 48 h, so the estimate falls back to the average transit time of this lane.',
    },
    documents: euRoadDocuments(id, at(-61), '8481.80', 780),
    exceptions: [
      {
        id: `${id}-X1`,
        type: 'staleTracking',
        openedAt: at(-24),
        aiDiagnosis: {
          summary: 'Vascor Trans has sent no update for 48 h. The last message says the truck was waiting for an unloading slot, but it was mapped with low confidence and needs review.',
          basedOnEventIds: [`${id}-E2`],
        },
        draft: { status: 'none' },
      },
    ],
  }
}

/** SH-1051 · road incident reported by email. */
function incidentShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1051'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'transauto', origin: 'Bilbao plant', destination: 'Stuttgart', plannedDepartureAt: at(-30), plannedArrivalAt: at(14) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Bilbao plant', occurredAt: at(-30), channel: 'api', rawText: 'PICKUP CONFIRMED BILBAO PLANT', mapping: rule('PICKUP CONFIRMED → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-63 near Bordeaux', occurredAt: at(-18), channel: 'api', rawText: 'IN TRANSIT A-63 BORDEAUX', mapping: rule('IN TRANSIT → In transit') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'incident', location: 'A10 near Poitiers', occurredAt: at(-5.5), channel: 'email', rawText: 'Accident on A10 near Poitiers, driver OK, trailer being inspected. Will revert with new ETA.', mapping: ai(88), reportLagMinutes: 25 },
  ])

  return {
    id,
    customerId: 'nordwerk',
    originSiteId: 'bilbao-plant',
    destination: { name: 'Nordwerk GmbH Werk Süd', city: 'Stuttgart', countryCode: 'DE' },
    cargo: 'Gearbox housings, 8 pallets',
    bookedAt: at(-50),
    plannedDeliveryAt: at(14),
    erpOrder: { poNumber: '4500-1195', hsCode: '8483.40', grossWeightKg: 2650, requiredDocuments: EU_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: providedEta(at(14), 'transauto', 'api', at(-18)),
    estimatedEta: {
      date: at(38),
      earliest: at(30),
      latest: at(50),
      confidence: 77,
      reason: 'The carrier reported an accident and the trailer is being inspected; a replacement truck usually takes about a day.',
    },
    documents: euRoadDocuments(id, at(-31), '8483.40', 2650),
    exceptions: [
      {
        id: `${id}-X1`,
        type: 'incident',
        openedAt: at(-5),
        aiDiagnosis: {
          summary: 'Transauto reported an accident near Poitiers. The driver is unharmed and the trailer is being inspected. The carrier ETA was not updated after the incident.',
          basedOnEventIds: [`${id}-E3`],
        },
        draft: {
          status: 'pending',
          body: 'Hello Nordwerk team, the truck carrying shipment SH-1051 (PO 4500-1195) was involved in a road incident in France. Nobody was hurt and the goods are being inspected. We expect delivery about one day later than planned and will confirm the new date shortly.',
        },
      },
    ],
  }
}

/** SH-1033 · on track: our estimate is in line with the carrier ETA. */
function onTrackShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1033'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Zaragoza plant', destination: 'Basel', plannedDepartureAt: at(-20), plannedArrivalAt: at(18) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-20), channel: 'api', rawText: 'PICKED_UP', mapping: rule('PICKED_UP → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'AP-7 near Perpignan', occurredAt: at(-8), channel: 'api', rawText: 'IN_TRANSIT · POSITION AP-7 PERPIGNAN', mapping: rule('IN_TRANSIT → In transit') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-9 near Nîmes', occurredAt: at(-0.5), channel: 'api', rawText: 'IN_TRANSIT · POSITION A-9 NIMES', mapping: rule('IN_TRANSIT → In transit'), reportLagMinutes: 6 },
  ])

  return {
    id,
    customerId: 'alpen-werkzeug',
    originSiteId: 'zaragoza-plant',
    destination: { name: 'Alpen Werkzeug Basel', city: 'Basel', countryCode: 'CH' },
    cargo: 'Precision drill bits, 3 pallets',
    bookedAt: at(-44),
    plannedDeliveryAt: at(18),
    erpOrder: { poNumber: '4500-1176', hsCode: '8207.50', grossWeightKg: 640, requiredDocuments: SWISS_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: providedEta(at(18), 'euroruta', 'api', at(-0.4)),
    estimatedEta: {
      date: at(18),
      earliest: at(16),
      latest: at(20),
      confidence: 90,
      reason: 'EuroRuta is on schedule and this lane was on time in 9 of the last 10 trips.',
    },
    documents: swissRoadDocuments(id, at(-21), '8207.50', 640),
    exceptions: [],
  }
}

/** SH-1034 · suspected delay at 58 %: below the 75 % threshold, so "Watching" with no exception. */
function suspectedDelayShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1034'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Barcelona warehouse', destination: 'Milan', plannedDepartureAt: at(-16), plannedArrivalAt: at(20) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Barcelona warehouse', occurredAt: at(-16), channel: 'api', rawText: 'PICKED_UP', mapping: rule('PICKED_UP → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-8 near Nice', occurredAt: at(-3), channel: 'api', rawText: 'IN_TRANSIT · POSITION A-8 NICE · SPEED 12 KM/H', mapping: rule('IN_TRANSIT → In transit') },
  ])

  return {
    id,
    customerId: 'alpen-werkzeug',
    originSiteId: 'barcelona-warehouse',
    destination: { name: 'Alpen Werkzeug Italia', city: 'Milan', countryCode: 'IT' },
    cargo: 'Bench grinders, 5 pallets',
    bookedAt: at(-40),
    plannedDeliveryAt: at(20),
    erpOrder: { poNumber: '4500-1182', hsCode: '8460.29', grossWeightKg: 1150, requiredDocuments: EU_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: providedEta(at(20), 'euroruta', 'api', at(-3)),
    estimatedEta: {
      date: at(27),
      earliest: at(20),
      latest: at(34),
      confidence: 58,
      reason: 'Slow traffic on the A-8 near Nice; the carrier ETA may slip by about 7 h.',
    },
    documents: euRoadDocuments(id, at(-17), '8460.29', 1150),
    aiSignal: {
      text: 'Possible delay of 0–14 h, most likely about 7 h. Signals: the last GPS position reports 12 km/h on the A-8 near Nice and traffic there is slow. Not enough evidence to open an exception yet; we re-evaluate with every new GPS ping.',
      evidenceLabel: 'Based on 9 GPS pings and 1 traffic feed',
      basedOnEventIds: [`${id}-E1`, `${id}-E2`],
    },
    exceptions: [],
  }
}

/** SH-1035 · predicted delay at 92 %: above the threshold, so an exception opened automatically. */
function confidentDelayShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1035'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'transauto', origin: 'Zaragoza plant', destination: 'Munich', plannedDepartureAt: at(-26), plannedArrivalAt: at(8) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-26), channel: 'api', rawText: 'PICKUP CONFIRMED ZARAGOZA PLANT', mapping: rule('PICKUP CONFIRMED → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-7 near Lyon', occurredAt: at(-10), channel: 'api', rawText: 'IN TRANSIT A-7 LYON', mapping: rule('IN TRANSIT → In transit') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'delayed', location: 'Mâcon rest area', occurredAt: at(-1), channel: 'api', rawText: 'DRIVER REST STOP MANDATORY 11H - MACON', mapping: rule('DRIVER REST STOP → Delayed') },
  ])

  return {
    id,
    customerId: 'nordwerk',
    originSiteId: 'zaragoza-plant',
    destination: { name: 'Nordwerk GmbH Werk München', city: 'Munich', countryCode: 'DE' },
    cargo: 'Electric motor stators, 7 pallets',
    bookedAt: at(-48),
    plannedDeliveryAt: at(8),
    erpOrder: { poNumber: '4500-1189', hsCode: '8503.00', grossWeightKg: 2100, requiredDocuments: EU_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: providedEta(at(8), 'transauto', 'api', at(-1)),
    estimatedEta: {
      date: at(18),
      earliest: at(17),
      latest: at(21),
      confidence: 92,
      reason: 'The driver started an 11 h mandatory rest 1 h ago, so with about 8 h of driving left the truck cannot reach Munich before early tomorrow morning.',
    },
    documents: euRoadDocuments(id, at(-27), '8503.00', 2100),
    aiSignal: {
      text: 'Delay very likely (~10 h). The driver started an 11 h mandatory rest at the Mâcon rest area 1 h ago, with about 8 h of driving left to Munich. The carrier ETA has not changed, so we keep showing it as reported.',
      evidenceLabel: 'Based on 18 GPS pings and EU driver-hours rules',
      basedOnEventIds: [`${id}-E2`, `${id}-E3`],
    },
    exceptions: [
      {
        id: `${id}-X1`,
        type: 'predictedDelay',
        openedAt: at(-0.8),
        aiDiagnosis: {
          summary: 'The driver started an 11 h mandatory rest near Mâcon 1 h ago. With 10 h of rest left and about 8 h of driving to Munich, delivery is about 10 h later than the carrier ETA, which has not changed.',
          basedOnEventIds: [`${id}-E2`, `${id}-E3`],
        },
        draft: {
          status: 'pending',
          body: 'Hello Nordwerk team, shipment SH-1035 (PO 4500-1189) is running late because of a mandatory driver rest. We now expect delivery early tomorrow morning instead of this evening.',
        },
      },
    ],
  }
}

/** SH-1044 · the carrier sends no ETA; only our estimate is available. */
function noCarrierEtaShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1044'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'vascor-trans', origin: 'Barcelona warehouse', destination: 'Madrid', plannedDepartureAt: at(-8), plannedArrivalAt: at(10) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Barcelona warehouse', occurredAt: at(-8), channel: 'portal', rawText: 'Recogida realizada - Almacén Barcelona', mapping: rule('Recogida realizada → Picked up') },
  ])

  return {
    id,
    customerId: 'brenner-iberia',
    originSiteId: 'barcelona-warehouse',
    destination: { name: 'Brenner Iberia S.L.', city: 'Madrid', countryCode: 'ES' },
    cargo: 'Compressor units, 2 pallets',
    bookedAt: at(-30),
    plannedDeliveryAt: at(10),
    erpOrder: { poNumber: '4500-1199', hsCode: '8414.80', grossWeightKg: 520, requiredDocuments: EU_ROAD_DOCUMENTS },
    legs,
    ...tracking,
    carrierEta: { status: 'notProvided' },
    estimatedEta: {
      date: at(11),
      earliest: at(9),
      latest: at(14),
      confidence: 70,
      reason: 'Vascor Trans does not send ETAs; the estimate uses the pickup time and the average transit time of this lane.',
    },
    documents: euRoadDocuments(id, at(-9), '8414.80', 520),
    aiSignal: {
      text: 'Possible delay: Vascor Trans sends no ETA, so our estimate has nothing to be compared with. Signal: the only update so far is the pickup, 8 h ago. Not enough evidence to alert the customer; we re-evaluate with every new update from the carrier.',
      evidenceLabel: 'Based on 1 carrier event and the average transit time of this lane',
      basedOnEventIds: [`${id}-E1`],
    },
    exceptions: [],
  }
}

/** SH-1009 · delivered one day earlier than planned, with proof of delivery. */
function deliveredEarlyShipment(at: (hours: number) => string): Shipment {
  const id = 'SH-1009'
  const legs: Leg[] = [
    { id: `${id}-L1`, mode: 'road', carrierId: 'transauto', origin: 'Zaragoza plant', destination: 'Hamburg', plannedDepartureAt: at(-100), plannedArrivalAt: at(-24) },
  ]
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-100), channel: 'api', rawText: 'PICKUP CONFIRMED ZARAGOZA PLANT', mapping: rule('PICKUP CONFIRMED → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'inTransit', location: 'A-7 near Kassel', occurredAt: at(-56), channel: 'api', rawText: 'IN TRANSIT A-7 KASSEL', mapping: rule('IN TRANSIT → In transit') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'outForDelivery', location: 'Hamburg', occurredAt: at(-50), channel: 'api', rawText: 'OUT FOR DELIVERY HAMBURG', mapping: rule('OUT FOR DELIVERY → Out for delivery') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'delivered', location: 'Nordwerk GmbH, Hamburg', occurredAt: at(-48), channel: 'api', rawText: 'DELIVERED · POD SIGNED M. KELLER', mapping: rule('DELIVERED → Delivered') },
  ])

  return {
    id,
    customerId: 'nordwerk',
    originSiteId: 'zaragoza-plant',
    destination: { name: 'Nordwerk GmbH', city: 'Hamburg', countryCode: 'DE' },
    cargo: 'Angle grinder kits, 10 pallets',
    bookedAt: at(-130),
    plannedDeliveryAt: at(-24),
    erpOrder: { poNumber: '4500-1140', hsCode: '8467.29', grossWeightKg: 3100, requiredDocuments: [...EU_ROAD_DOCUMENTS, 'proofOfDelivery'] },
    legs,
    ...tracking,
    carrierEta: providedEta(at(-48), 'transauto', 'api', at(-48)),
    estimatedEta: {
      date: at(-48),
      earliest: at(-48),
      latest: at(-48),
      confidence: 100,
      reason: 'Delivered and confirmed by the signed proof of delivery.',
    },
    documents: [
      ...euRoadDocuments(id, at(-101), '8467.29', 3100),
      receivedDocument(id, 'proofOfDelivery', at(-47.5)),
    ],
    exceptions: [],
  }
}

/** The sailing of the SH-1060 sea leg; the simulated event moves it to the next one. */
type Sailing = {
  vessel: string
  voyage: string
  /** Departure, in hours from `demoNow`. Sea and onward road times follow from it. */
  departureHours: number
}

/** Legs of SH-1060 for a given sailing, shared by the seed and the simulated event. */
function simulationTargetLegs(at: (hours: number) => string, sailing: Sailing): Leg[] {
  const id = SIMULATED_EVENT_SHIPMENT_ID
  const arrivalHours = sailing.departureHours + 36
  return [
    { id: `${id}-L1`, mode: 'road', carrierId: 'vascor-trans', origin: 'Bilbao plant', destination: 'Bilbao port', plannedDepartureAt: at(-8), plannedArrivalAt: at(-6) },
    { id: `${id}-L2`, mode: 'sea', carrierId: 'mareline', origin: 'Bilbao port', destination: 'Le Havre port', plannedDepartureAt: at(sailing.departureHours), plannedArrivalAt: at(arrivalHours), vessel: sailing.vessel, voyage: sailing.voyage },
    { id: `${id}-L3`, mode: 'road', carrierId: 'transauto', origin: 'Le Havre port', destination: 'Le Havre', plannedDepartureAt: at(arrivalHours + 4), plannedArrivalAt: at(arrivalHours + 8) },
  ]
}

/**
 * SH-1060 · on-track sea shipment from Bilbao to Le Havre. The "Simulate carrier event" demo
 * action rolls its vessel, which is how the seed covers the rolled-vessel scenario.
 */
function simulationTargetShipment(at: (hours: number) => string): Shipment {
  const id = SIMULATED_EVENT_SHIPMENT_ID
  const legs = simulationTargetLegs(at, { vessel: 'Mareline Levante', voyage: 'ML-0842', departureHours: 6 })
  const tracking = buildTracking(id, legs, [
    { kind: 'carrier', legId: `${id}-L1`, status: 'pickedUp', location: 'Bilbao plant', occurredAt: at(-8), channel: 'portal', rawText: 'Recogida realizada - Planta Bilbao', mapping: rule('Recogida realizada → Picked up') },
    { kind: 'carrier', legId: `${id}-L1`, status: 'arrived', location: 'Bilbao port', occurredAt: at(-6), channel: 'portal', rawText: 'Entregado en terminal BIO', mapping: rule('Entregado en terminal → Arrived') },
    { kind: 'carrier', legId: `${id}-L2`, status: 'arrived', location: 'Bilbao port terminal', occurredAt: at(-5), channel: 'edi', rawText: 'CODECO GATE IN FULL BILBAO', mapping: rule('CODECO GATE IN → Arrived') },
  ])

  return {
    id,
    customerId: 'brenner-iberia',
    originSiteId: 'bilbao-plant',
    destination: { name: 'Brenner Iberia France', city: 'Le Havre', countryCode: 'FR' },
    cargo: 'Hydraulic press spare parts, 2 crates',
    bookedAt: at(-72),
    plannedDeliveryAt: at(50),
    erpOrder: { poNumber: '4500-1203', hsCode: '8466.94', grossWeightKg: 960, requiredDocuments: ['commercialInvoice', 'packingList', 'billOfLading'] },
    legs,
    ...tracking,
    carrierEta: providedEta(at(50), 'mareline', 'edi', at(-5)),
    estimatedEta: {
      date: at(50),
      earliest: at(47),
      latest: at(54),
      confidence: 87,
      reason: 'The container is at the Bilbao terminal and Mareline Levante is on schedule.',
    },
    documents: [
      receivedDocument(id, 'commercialInvoice', at(-8), { hsCode: '8466.94', grossWeightKg: 960 }),
      receivedDocument(id, 'packingList', at(-8), { grossWeightKg: 960 }),
      pendingDocument(id, 'billOfLading'),
    ],
    exceptions: [],
  }
}

/** Shipments that complete the list: varied customers, sites, carriers and normal states. */
function routineShipments(at: (hours: number) => string): Shipment[] {
  const brennerDelivered = 'SH-1012'
  const brennerDeliveredLegs: Leg[] = [
    { id: `${brennerDelivered}-L1`, mode: 'road', carrierId: 'vascor-trans', origin: 'Bilbao plant', destination: 'Valencia', plannedDepartureAt: at(-84), plannedArrivalAt: at(-72) },
  ]

  const alpenBooked = 'SH-1066'
  const alpenBookedLegs: Leg[] = [
    { id: `${alpenBooked}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Barcelona warehouse', destination: 'Zurich', plannedDepartureAt: at(20), plannedArrivalAt: at(52) },
  ]

  const brennerLisbon = 'SH-1048'
  const brennerLisbonLegs: Leg[] = [
    { id: `${brennerLisbon}-L1`, mode: 'road', carrierId: 'vascor-trans', origin: 'Zaragoza plant', destination: 'Lisbon', plannedDepartureAt: at(-12), plannedArrivalAt: at(12) },
  ]

  const nordwerkSea = 'SH-1053'
  const nordwerkSeaLegs: Leg[] = [
    { id: `${nordwerkSea}-L1`, mode: 'road', carrierId: 'transauto', origin: 'Bilbao plant', destination: 'Bilbao port', plannedDepartureAt: at(-40), plannedArrivalAt: at(-38) },
    { id: `${nordwerkSea}-L2`, mode: 'sea', carrierId: 'nordsee-line', origin: 'Bilbao port', destination: 'Rotterdam port', plannedDepartureAt: at(-34), plannedArrivalAt: at(26), vessel: 'Nordsee Boreas', voyage: 'NB-1172' },
    { id: `${nordwerkSea}-L3`, mode: 'road', carrierId: 'transauto', origin: 'Rotterdam port', destination: 'Duisburg', plannedDepartureAt: at(30), plannedArrivalAt: at(34) },
  ]

  const alpenBern = 'SH-1039'
  const alpenBernLegs: Leg[] = [
    { id: `${alpenBern}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Bilbao plant', destination: 'Bern', plannedDepartureAt: at(-22), plannedArrivalAt: at(10) },
  ]

  return [
    {
      id: brennerDelivered,
      customerId: 'brenner-iberia',
      originSiteId: 'bilbao-plant',
      destination: { name: 'Brenner Iberia Levante', city: 'Valencia', countryCode: 'ES' },
      cargo: 'Conveyor rollers, 4 pallets',
      bookedAt: at(-110),
      plannedDeliveryAt: at(-72),
      erpOrder: { poNumber: '4500-1146', hsCode: '8431.39', grossWeightKg: 1450, requiredDocuments: [...EU_ROAD_DOCUMENTS, 'proofOfDelivery'] },
      legs: brennerDeliveredLegs,
      ...buildTracking(brennerDelivered, brennerDeliveredLegs, [
        { kind: 'carrier', legId: `${brennerDelivered}-L1`, status: 'pickedUp', location: 'Bilbao plant', occurredAt: at(-84), channel: 'portal', rawText: 'Recogida realizada - Planta Bilbao', mapping: rule('Recogida realizada → Picked up') },
        { kind: 'carrier', legId: `${brennerDelivered}-L1`, status: 'delivered', location: 'Brenner Iberia Levante, Valencia', occurredAt: at(-70), channel: 'portal', rawText: 'Entregado - firmado por J. Navarro', mapping: rule('Entregado → Delivered') },
      ]),
      carrierEta: providedEta(at(-70), 'vascor-trans', 'portal', at(-70)),
      estimatedEta: { date: at(-70), earliest: at(-70), latest: at(-70), confidence: 100, reason: 'Delivered and confirmed by the signed proof of delivery.' },
      documents: [...euRoadDocuments(brennerDelivered, at(-85), '8431.39', 1450), receivedDocument(brennerDelivered, 'proofOfDelivery', at(-69))],
      exceptions: [],
    },
    {
      id: alpenBooked,
      customerId: 'alpen-werkzeug',
      originSiteId: 'barcelona-warehouse',
      destination: { name: 'Alpen Werkzeug AG', city: 'Zurich', countryCode: 'CH' },
      cargo: 'Workbench frames, 6 pallets',
      bookedAt: at(-4),
      plannedDeliveryAt: at(52),
      erpOrder: { poNumber: '4500-1210', hsCode: '9403.20', grossWeightKg: 1980, requiredDocuments: SWISS_ROAD_DOCUMENTS },
      legs: alpenBookedLegs,
      ...buildTracking(alpenBooked, alpenBookedLegs, [
        { kind: 'carrier', legId: `${alpenBooked}-L1`, status: 'booked', location: 'Barcelona warehouse', occurredAt: at(-4), channel: 'api', rawText: 'BOOKING_CONFIRMED', mapping: rule('BOOKING_CONFIRMED → Booked') },
      ]),
      carrierEta: providedEta(at(52), 'euroruta', 'api', at(-4)),
      estimatedEta: { date: at(54), earliest: at(50), latest: at(60), confidence: 80, reason: 'Not picked up yet; the estimate uses the booked pickup time and the average transit time of this lane.' },
      documents: [
        receivedDocument(alpenBooked, 'commercialInvoice', at(-4), { hsCode: '9403.20', grossWeightKg: 1980 }),
        pendingDocument(alpenBooked, 'packingList'),
        pendingDocument(alpenBooked, 'cmr'),
        pendingDocument(alpenBooked, 'certificateOfOrigin'),
        pendingDocument(alpenBooked, 'customsDeclaration'),
      ],
      exceptions: [],
    },
    {
      id: brennerLisbon,
      customerId: 'brenner-iberia',
      originSiteId: 'zaragoza-plant',
      destination: { name: 'Brenner Iberia Portugal', city: 'Lisbon', countryCode: 'PT' },
      cargo: 'Pump assemblies, 3 pallets',
      bookedAt: at(-36),
      plannedDeliveryAt: at(12),
      erpOrder: { poNumber: '4500-1191', hsCode: '8413.70', grossWeightKg: 890, requiredDocuments: EU_ROAD_DOCUMENTS },
      legs: brennerLisbonLegs,
      ...buildTracking(brennerLisbon, brennerLisbonLegs, [
        { kind: 'carrier', legId: `${brennerLisbon}-L1`, status: 'pickedUp', location: 'Zaragoza plant', occurredAt: at(-12), channel: 'portal', rawText: 'Recogida realizada - Planta Zaragoza', mapping: rule('Recogida realizada → Picked up') },
        { kind: 'carrier', legId: `${brennerLisbon}-L1`, status: 'inTransit', location: 'A-5 near Mérida', occurredAt: at(-2), channel: 'portal', rawText: 'En tránsito - A-5 Mérida', mapping: rule('En tránsito → In transit') },
      ]),
      carrierEta: providedEta(at(12), 'vascor-trans', 'portal', at(-2)),
      estimatedEta: { date: at(13), earliest: at(11), latest: at(15), confidence: 86, reason: 'Vascor Trans is on schedule on this lane.' },
      documents: euRoadDocuments(brennerLisbon, at(-13), '8413.70', 890),
      exceptions: [],
    },
    {
      id: nordwerkSea,
      customerId: 'nordwerk',
      originSiteId: 'bilbao-plant',
      destination: { name: 'Nordwerk GmbH Werk West', city: 'Duisburg', countryCode: 'DE' },
      cargo: 'Steel tool cabinets, 12 pallets',
      bookedAt: at(-70),
      plannedDeliveryAt: at(34),
      erpOrder: { poNumber: '4500-1179', hsCode: '9403.20', grossWeightKg: 4200, requiredDocuments: ['commercialInvoice', 'packingList', 'billOfLading'] },
      legs: nordwerkSeaLegs,
      ...buildTracking(nordwerkSea, nordwerkSeaLegs, [
        { kind: 'carrier', legId: `${nordwerkSea}-L1`, status: 'pickedUp', location: 'Bilbao plant', occurredAt: at(-40), channel: 'api', rawText: 'PICKUP CONFIRMED BILBAO PLANT', mapping: rule('PICKUP CONFIRMED → Picked up') },
        { kind: 'carrier', legId: `${nordwerkSea}-L1`, status: 'arrived', location: 'Bilbao port', occurredAt: at(-38), channel: 'api', rawText: 'DELIVERED TO TERMINAL BILBAO', mapping: rule('DELIVERED TO TERMINAL → Arrived') },
        { kind: 'carrier', legId: `${nordwerkSea}-L2`, status: 'loadedOnVessel', location: 'Bilbao port', occurredAt: at(-35), channel: 'edi', rawText: 'IFTSTA LOADED ON BOARD NORDSEE BOREAS NB-1172', mapping: rule('IFTSTA LOADED ON BOARD → Loaded on vessel') },
        { kind: 'carrier', legId: `${nordwerkSea}-L2`, status: 'departed', location: 'Bilbao port', occurredAt: at(-34), channel: 'edi', rawText: 'IFTSTA VESSEL DEPARTURE BILBAO', mapping: rule('IFTSTA VESSEL DEPARTURE → Departed') },
        { kind: 'carrier', legId: `${nordwerkSea}-L2`, status: 'inTransit', location: 'Bay of Biscay', occurredAt: at(-10), channel: 'edi', rawText: 'IFTSTA POSITION REPORT BAY OF BISCAY', mapping: rule('IFTSTA POSITION REPORT → In transit') },
      ]),
      carrierEta: providedEta(at(34), 'nordsee-line', 'edi', at(-10)),
      estimatedEta: { date: at(34), earliest: at(31), latest: at(38), confidence: 88, reason: 'Nordsee Boreas is on schedule and the Rotterdam terminal reports no congestion.' },
      documents: [
        receivedDocument(nordwerkSea, 'commercialInvoice', at(-41), { hsCode: '9403.20', grossWeightKg: 4200 }),
        receivedDocument(nordwerkSea, 'packingList', at(-41), { grossWeightKg: 4200 }),
        receivedDocument(nordwerkSea, 'billOfLading', at(-33), { grossWeightKg: 4200 }),
      ],
      exceptions: [],
    },
    {
      id: alpenBern,
      customerId: 'alpen-werkzeug',
      originSiteId: 'bilbao-plant',
      destination: { name: 'Alpen Werkzeug Bern', city: 'Bern', countryCode: 'CH' },
      cargo: 'Router spindles, 2 pallets',
      bookedAt: at(-46),
      plannedDeliveryAt: at(10),
      erpOrder: { poNumber: '4500-1186', hsCode: '8466.93', grossWeightKg: 410, requiredDocuments: SWISS_ROAD_DOCUMENTS },
      legs: alpenBernLegs,
      ...buildTracking(alpenBern, alpenBernLegs, [
        { kind: 'carrier', legId: `${alpenBern}-L1`, status: 'pickedUp', location: 'Bilbao plant', occurredAt: at(-22), channel: 'api', rawText: 'PICKED_UP', mapping: rule('PICKED_UP → Picked up') },
        { kind: 'carrier', legId: `${alpenBern}-L1`, status: 'inTransit', location: 'A-36 near Besançon', occurredAt: at(-1.5), channel: 'api', rawText: 'IN_TRANSIT · POSITION A-36 BESANCON', mapping: rule('IN_TRANSIT → In transit') },
      ]),
      carrierEta: providedEta(at(10), 'euroruta', 'api', at(-1.5)),
      estimatedEta: { date: at(10), earliest: at(9), latest: at(12), confidence: 91, reason: 'EuroRuta is on schedule and the Basel border queue is short this morning.' },
      documents: swissRoadDocuments(alpenBern, at(-23), '8466.93', 410),
      exceptions: [],
    },
  ]
}

/** Shipments from the Lyon warehouse, outside the ops user's scope (one with an open exception). */
function outOfScopeShipments(at: (hours: number) => string): Shipment[] {
  const alpenGeneva = 'SH-1055'
  const alpenGenevaLegs: Leg[] = [
    { id: `${alpenGeneva}-L1`, mode: 'road', carrierId: 'euroruta', origin: 'Lyon warehouse', destination: 'Geneva', plannedDepartureAt: at(-3), plannedArrivalAt: at(3) },
  ]

  const nordwerkFrankfurt = 'SH-1058'
  const nordwerkFrankfurtLegs: Leg[] = [
    { id: `${nordwerkFrankfurt}-L1`, mode: 'road', carrierId: 'transauto', origin: 'Lyon warehouse', destination: 'Frankfurt', plannedDepartureAt: at(-40), plannedArrivalAt: at(-4) },
  ]

  return [
    {
      id: alpenGeneva,
      customerId: 'alpen-werkzeug',
      originSiteId: 'lyon-warehouse',
      destination: { name: 'Alpen Werkzeug Genève', city: 'Geneva', countryCode: 'CH' },
      cargo: 'Hand tool assortments, 2 pallets',
      bookedAt: at(-24),
      plannedDeliveryAt: at(3),
      erpOrder: { poNumber: '4500-1205', hsCode: '8205.59', grossWeightKg: 380, requiredDocuments: SWISS_ROAD_DOCUMENTS },
      legs: alpenGenevaLegs,
      ...buildTracking(alpenGeneva, alpenGenevaLegs, [
        { kind: 'carrier', legId: `${alpenGeneva}-L1`, status: 'pickedUp', location: 'Lyon warehouse', occurredAt: at(-3), channel: 'api', rawText: 'PICKED_UP', mapping: rule('PICKED_UP → Picked up') },
      ]),
      carrierEta: providedEta(at(3), 'euroruta', 'api', at(-3)),
      estimatedEta: { date: at(3), earliest: at(2), latest: at(5), confidence: 89, reason: 'Short lane with no reported traffic.' },
      documents: swissRoadDocuments(alpenGeneva, at(-4), '8205.59', 380),
      exceptions: [],
    },
    {
      id: nordwerkFrankfurt,
      customerId: 'nordwerk',
      originSiteId: 'lyon-warehouse',
      destination: { name: 'Nordwerk GmbH Logistikzentrum', city: 'Frankfurt', countryCode: 'DE' },
      cargo: 'Spare part kits, 5 pallets',
      bookedAt: at(-60),
      plannedDeliveryAt: at(-4),
      erpOrder: { poNumber: '4500-1162', hsCode: '8466.94', grossWeightKg: 1020, requiredDocuments: EU_ROAD_DOCUMENTS },
      legs: nordwerkFrankfurtLegs,
      ...buildTracking(nordwerkFrankfurt, nordwerkFrankfurtLegs, [
        { kind: 'carrier', legId: `${nordwerkFrankfurt}-L1`, status: 'pickedUp', location: 'Lyon warehouse', occurredAt: at(-40), channel: 'api', rawText: 'PICKUP CONFIRMED LYON WAREHOUSE', mapping: rule('PICKUP CONFIRMED → Picked up') },
        { kind: 'carrier', legId: `${nordwerkFrankfurt}-L1`, status: 'inTransit', location: 'A-31 near Nancy', occurredAt: at(-30), channel: 'api', rawText: 'IN TRANSIT A-31 NANCY', mapping: rule('IN TRANSIT → In transit') },
      ]),
      carrierEta: providedEta(at(-4), 'transauto', 'api', at(-30)),
      estimatedEta: { date: at(8), earliest: at(2), latest: at(20), confidence: 60, reason: 'No carrier update for 30 h, so the estimate falls back to the average transit time of this lane.' },
      documents: euRoadDocuments(nordwerkFrankfurt, at(-41), '8466.94', 1020),
      exceptions: [
        {
          id: `${nordwerkFrankfurt}-X1`,
          type: 'staleTracking',
          openedAt: at(-6),
          aiDiagnosis: {
            summary: 'Transauto has sent no update for 30 h and the carrier ETA has passed without a delivery event.',
            basedOnEventIds: [`${nordwerkFrankfurt}-E2`],
          },
          draft: { status: 'none' },
        },
      ],
    },
  ]
}

/**
 * Builds the full demo state: 3 customers, 4 sites (3 in the ops scope), 5 carriers and 18
 * shipments covering every state of the demo story. Returns a fresh object on every call, so
 * callers may mutate it freely.
 */
export function createSeed(demoNow: Date = new Date(DEMO_NOW_ISO)): DemoState {
  const at = createClock(demoNow)

  return {
    customers: structuredClone(customers),
    sites: structuredClone(sites),
    carriers: structuredClone(carriers),
    shipments: [
      customsHoldShipment(at),
      quietTerminalShipment(at),
      predictedDelayShipment(at),
      staleShipment(at),
      incidentShipment(at),
      onTrackShipment(at),
      suspectedDelayShipment(at),
      confidentDelayShipment(at),
      noCarrierEtaShipment(at),
      deliveredEarlyShipment(at),
      simulationTargetShipment(at),
      ...routineShipments(at),
      ...outOfScopeShipments(at),
    ],
    unseenExceptionShipmentIds: [],
  }
}

/** Changes the scripted "Simulate carrier event" applies to {@link SIMULATED_EVENT_SHIPMENT_ID}. */
export type SimulatedCarrierEvent = {
  /** Legs after the roll: the sea leg carries the new vessel, voyage and sailing times. */
  legs: Leg[]
  rawEvent: RawCarrierEvent
  milestone: Milestone
  carrierEta: CarrierEta
  estimatedEta: EstimatedEta
  exception: ShipmentException
}

/**
 * The scripted carrier event of the demo: Mareline rolls the SH-1060 container to the next
 * sailing. `receivedAt` is the moment the demo action is triggered; the ETAs are relative to
 * `demoNow` so they stay consistent with the rest of the seed.
 */
export function createSimulatedCarrierEvent(receivedAt: Date, demoNow: Date = new Date(DEMO_NOW_ISO)): SimulatedCarrierEvent {
  const at = createClock(demoNow)
  const id = SIMULATED_EVENT_SHIPMENT_ID
  const receivedAtIso = receivedAt.toISOString()

  return {
    legs: simulationTargetLegs(at, { vessel: 'Mareline Poniente', voyage: 'ML-0846', departureHours: 78 }),
    rawEvent: {
      id: SIMULATED_EVENT_ID,
      carrierId: 'mareline',
      channel: 'edi',
      receivedAt: receivedAtIso,
      rawText: 'CODECO ROLLED - NOT LOADED ML-0842 / NEXT VSL MARELINE PONIENTE ML-0846',
      normalizedStatus: 'vesselRolled',
      mapping: rule('CODECO ROLLED → Vessel rolled'),
    },
    milestone: {
      id: SIMULATED_MILESTONE_ID,
      legId: `${id}-L2`,
      status: 'vesselRolled',
      location: 'Bilbao port',
      occurredAt: receivedAtIso,
      receivedAt: receivedAtIso,
      source: 'carrier',
      rawEventIds: [SIMULATED_EVENT_ID],
    },
    carrierEta: providedEta(at(122), 'mareline', 'edi', receivedAtIso),
    estimatedEta: {
      date: at(124),
      earliest: at(118),
      latest: at(134),
      confidence: 86,
      reason: 'Mareline moved the container to the next sailing, Mareline Poniente, which departs in about 3 days.',
    },
    exception: {
      id: SIMULATED_EXCEPTION_ID,
      type: 'vesselRolled',
      openedAt: receivedAtIso,
      aiDiagnosis: {
        summary: 'Mareline did not load the container on Mareline Levante (ML-0842) and moved it to Mareline Poniente (ML-0846). Delivery to Le Havre moves about 3 days later than planned.',
        basedOnEventIds: [`${id}-E3`, SIMULATED_EVENT_ID],
      },
      draft: {
        status: 'pending',
        body: 'Hello Brenner Iberia team, the vessel carrying shipment SH-1060 (PO 4500-1203) will leave Bilbao without your container. It is booked on the next sailing and we now expect delivery about 3 days later than planned.',
      },
    },
  }
}
