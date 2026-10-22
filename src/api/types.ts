import { z } from 'zod'

/**
 * Domain model of the shipment visibility prototype. Every type is inferred from a zod schema
 * so the same definition validates data at the boundary (seed, `sessionStorage`) and types the
 * rest of the app. Dates are ISO 8601 UTC strings, which keeps the whole state JSON-serialisable
 * for `sessionStorage` without custom revivers.
 */

const isoDateTimeSchema = z.iso.datetime()

/** Percentage from 0 to 100, as shown in the UI ("Estimated · 92 %"). */
const percentageSchema = z.number().int().min(0).max(100)

/** Ways a carrier can send us data. Shown as the event channel and the carrier ETA source. */
export const carrierChannelSchema = z.enum(['api', 'edi', 'email', 'portal'])

/** @see carrierChannelSchema */
export type CarrierChannel = z.infer<typeof carrierChannelSchema>

/** Transport mode of a carrier or a leg. */
export const transportModeSchema = z.enum(['road', 'sea'])

/** @see transportModeSchema */
export type TransportMode = z.infer<typeof transportModeSchema>

/**
 * A plant or warehouse that ships goods. `inOpsScope` marks the sites the demo operations user
 * ("Ops · Spain sites") is responsible for; out-of-scope sites are shown locked in the site filter.
 */
export const siteSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  countryCode: z.string().length(2),
  inOpsScope: z.boolean(),
})

/** @see siteSchema */
export type Site = z.infer<typeof siteSchema>

/** A road haulier or ocean line that moves one or more legs of a shipment. */
export const carrierSchema = z.object({
  id: z.string(),
  name: z.string(),
  mode: transportModeSchema,
})

/** @see carrierSchema */
export type Carrier = z.infer<typeof carrierSchema>

/** A customer or subsidiary. Its `id` is the path segment of the customer view. */
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  countryCode: z.string().length(2),
})

/** @see customerSchema */
export type Customer = z.infer<typeof customerSchema>

/** Delivery address of a shipment. */
export const destinationSchema = z.object({
  name: z.string(),
  city: z.string(),
  countryCode: z.string().length(2),
})

/** @see destinationSchema */
export type Destination = z.infer<typeof destinationSchema>

const legBaseSchema = z.object({
  id: z.string(),
  carrierId: z.string(),
  origin: z.string(),
  destination: z.string(),
  plannedDepartureAt: isoDateTimeSchema,
  plannedArrivalAt: isoDateTimeSchema,
})

/**
 * One carrier's part of the journey. Sea legs carry the vessel and voyage of the current booking:
 * when a vessel is rolled they change to the next sailing, and the raw events keep the history.
 */
export const legSchema = z.discriminatedUnion('mode', [
  legBaseSchema.extend({ mode: z.literal('road') }),
  legBaseSchema.extend({ mode: z.literal('sea'), vessel: z.string(), voyage: z.string() }),
])

/** @see legSchema */
export type Leg = z.infer<typeof legSchema>

/** Normalised milestone statuses. Carrier messages in any format are mapped onto this list. */
export const milestoneStatusSchema = z.enum([
  'booked',
  'pickedUp',
  'departed',
  'inTransit',
  'arrived',
  'loadedOnVessel',
  'vesselRolled',
  'customsHold',
  'customsCleared',
  'delayed',
  'incident',
  'outForDelivery',
  'delivered',
])

/** @see milestoneStatusSchema */
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>

const milestoneBaseSchema = z.object({
  id: z.string(),
  legId: z.string(),
  status: milestoneStatusSchema,
  location: z.string(),
  occurredAt: isoDateTimeSchema,
  receivedAt: isoDateTimeSchema,
})

/**
 * A normalised step of the journey. `occurredAt` is when it happened, `receivedAt` when we learnt
 * about it, so freshness and reporting lag can be told apart. `source: 'carrier'` milestones come
 * from one or more raw carrier events; `source: 'derived'` ones are system insights ("Derived from
 * GPS") with no carrier message behind them.
 */
export const milestoneSchema = z.discriminatedUnion('source', [
  milestoneBaseSchema.extend({ source: z.literal('carrier'), rawEventIds: z.array(z.string()).min(1) }),
  milestoneBaseSchema.extend({ source: z.literal('derived') }),
])

/** @see milestoneSchema */
export type Milestone = z.infer<typeof milestoneSchema>

/**
 * How a raw carrier message was mapped to a normalised status: by a deterministic rule, or by the
 * (simulated) AI with a confidence. Low-confidence AI mappings are flagged for human review.
 */
export const eventMappingSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('rule'), rule: z.string() }),
  z.object({ method: z.literal('ai'), confidence: percentageSchema }),
])

/** @see eventMappingSchema */
export type EventMapping = z.infer<typeof eventMappingSchema>

/**
 * A carrier message exactly as received, kept next to its normalised status so ops can audit
 * every mapping in the source events panel.
 */
export const rawCarrierEventSchema = z.object({
  id: z.string(),
  carrierId: z.string(),
  channel: carrierChannelSchema,
  receivedAt: isoDateTimeSchema,
  rawText: z.string(),
  normalizedStatus: milestoneStatusSchema,
  mapping: eventMappingSchema,
})

/** @see rawCarrierEventSchema */
export type RawCarrierEvent = z.infer<typeof rawCarrierEventSchema>

/**
 * The ETA reported by the carrier. It is always shown (ADR 0026), so a carrier that gives no ETA is
 * an explicit `notProvided` state instead of a missing value.
 */
export const carrierEtaSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('provided'),
    date: isoDateTimeSchema,
    source: z.object({ carrierId: z.string(), channel: carrierChannelSchema }),
    updatedAt: isoDateTimeSchema,
  }),
  z.object({ status: z.literal('notProvided') }),
])

/** @see carrierEtaSchema */
export type CarrierEta = z.infer<typeof carrierEtaSchema>

/**
 * Our own ETA estimate. It always has a date, a range and a confidence (ADR 0022, ADR 0026);
 * `reason` is the one-line "Why" shown next to it.
 */
export const estimatedEtaSchema = z.object({
  date: isoDateTimeSchema,
  earliest: isoDateTimeSchema,
  latest: isoDateTimeSchema,
  confidence: percentageSchema,
  reason: z.string(),
})

/** @see estimatedEtaSchema */
export type EstimatedEta = z.infer<typeof estimatedEtaSchema>

/** Document types handled by the prototype. */
export const documentTypeSchema = z.enum([
  'commercialInvoice',
  'packingList',
  'billOfLading',
  'cmr',
  'certificateOfOrigin',
  'customsDeclaration',
  'proofOfDelivery',
])

/** @see documentTypeSchema */
export type DocumentType = z.infer<typeof documentTypeSchema>

/**
 * Fields extracted from a received document, compared with the ERP order by the document check.
 * Partial because each document type carries different fields.
 */
export const extractedDocumentFieldsSchema = z.object({
  hsCode: z.string(),
  grossWeightKg: z.number().positive(),
}).partial()

/** @see extractedDocumentFieldsSchema */
export type ExtractedDocumentFields = z.infer<typeof extractedDocumentFieldsSchema>

/**
 * A document attached to the shipment. A required document with no entry at all is "missing";
 * `pending` means it is expected but not received yet (customers see it as pending).
 */
export const shipmentDocumentSchema = z.discriminatedUnion('status', [
  z.object({
    id: z.string(),
    type: documentTypeSchema,
    status: z.literal('received'),
    fileName: z.string(),
    receivedAt: isoDateTimeSchema,
    extracted: extractedDocumentFieldsSchema,
  }),
  z.object({
    id: z.string(),
    type: documentTypeSchema,
    status: z.literal('pending'),
  }),
])

/** @see shipmentDocumentSchema */
export type ShipmentDocument = z.infer<typeof shipmentDocumentSchema>

/** The ERP order a shipment fulfils: internal data, never shown to customers. */
export const erpOrderSchema = z.object({
  poNumber: z.string(),
  hsCode: z.string(),
  grossWeightKg: z.number().positive(),
  requiredDocuments: z.array(documentTypeSchema),
})

/** @see erpOrderSchema */
export type ErpOrder = z.infer<typeof erpOrderSchema>

/** Kinds of exception the inbox handles. */
export const exceptionTypeSchema = z.enum([
  'customsHold',
  'vesselRolled',
  'predictedDelay',
  'staleTracking',
  'incident',
])

/** @see exceptionTypeSchema */
export type ExceptionType = z.infer<typeof exceptionTypeSchema>

/**
 * The AI-drafted customer notice of an exception. Nothing is sent without approval, so the draft
 * moves from `pending` to `sent` (with `notifiedAt`) or `discarded` only through an ops action.
 * `none` is an exception that has no customer notice (for example stale tracking).
 */
export const customerNoticeDraftSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('none') }),
  z.object({ status: z.literal('pending'), body: z.string() }),
  z.object({ status: z.literal('sent'), body: z.string(), notifiedAt: isoDateTimeSchema }),
  z.object({ status: z.literal('discarded'), discardedAt: isoDateTimeSchema }),
])

/** @see customerNoticeDraftSchema */
export type CustomerNoticeDraft = z.infer<typeof customerNoticeDraftSchema>

/** AI explanation of an exception and the events it is based on ("Based on N events"). */
export const aiDiagnosisSchema = z.object({
  summary: z.string(),
  basedOnEventIds: z.array(z.string()).min(1),
})

/** @see aiDiagnosisSchema */
export type AiDiagnosis = z.infer<typeof aiDiagnosisSchema>

/**
 * The AI's early warning about a shipment that has no open exception yet (or whose exception was
 * opened by the same signal): what it expects, why, and what it is based on. Seeded only on
 * shipments the demo story needs it for; the detail falls back to the ETA reason without it.
 */
export const aiSignalSchema = z.object({
  text: z.string(),
  /** Ready-made evidence line ("Based on 9 GPS pings and 1 traffic feed"). */
  evidenceLabel: z.string(),
  /** Raw events the signal cites in the source events panel. */
  basedOnEventIds: z.array(z.string()),
})

/** @see aiSignalSchema */
export type AiSignal = z.infer<typeof aiSignalSchema>

/** An open exception on a shipment, listed in the ops inbox. */
export const shipmentExceptionSchema = z.object({
  id: z.string(),
  type: exceptionTypeSchema,
  openedAt: isoDateTimeSchema,
  aiDiagnosis: aiDiagnosisSchema,
  draft: customerNoticeDraftSchema,
})

/** @see shipmentExceptionSchema */
export type ShipmentException = z.infer<typeof shipmentExceptionSchema>

/**
 * A shipment with everything both views need. The current status, freshness and delay
 * classification are derived from `milestones`, `rawEvents` and the ETAs by `src/lib/`, so they
 * cannot drift out of sync when a carrier event is simulated. `exceptions` lists open exceptions
 * only and is empty when there is none.
 */
export const shipmentSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  originSiteId: z.string(),
  destination: destinationSchema,
  cargo: z.string(),
  bookedAt: isoDateTimeSchema,
  plannedDeliveryAt: isoDateTimeSchema,
  erpOrder: erpOrderSchema,
  legs: z.array(legSchema).min(1),
  milestones: z.array(milestoneSchema),
  rawEvents: z.array(rawCarrierEventSchema),
  carrierEta: carrierEtaSchema,
  estimatedEta: estimatedEtaSchema,
  documents: z.array(shipmentDocumentSchema),
  exceptions: z.array(shipmentExceptionSchema),
  aiSignal: aiSignalSchema.optional(),
})

/** @see shipmentSchema */
export type Shipment = z.infer<typeof shipmentSchema>

/** Static reference data the screens use to resolve ids into names. */
export const referenceDataSchema = z.object({
  customers: z.array(customerSchema),
  sites: z.array(siteSchema),
  carriers: z.array(carrierSchema),
})

/** @see referenceDataSchema */
export type ReferenceData = z.infer<typeof referenceDataSchema>

/** The whole demo state: what the mock database holds and persists to `sessionStorage`. */
export const demoStateSchema = referenceDataSchema.extend({
  shipments: z.array(shipmentSchema),
})

/** @see demoStateSchema */
export type DemoState = z.infer<typeof demoStateSchema>
