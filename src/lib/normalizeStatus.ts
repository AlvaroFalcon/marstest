import { orderBy } from 'es-toolkit'
import type { EventMapping, MilestoneStatus, RawCarrierEvent } from '@/api/types'
import { AI_REVIEW_THRESHOLD } from '@/lib/thresholds'

/**
 * Result of normalising a raw carrier message. `needsReview` is true only for AI mappings whose
 * confidence is below {@link AI_REVIEW_THRESHOLD}.
 */
export type NormalizedEvent = {
  status: MilestoneStatus
  mapping: EventMapping
  needsReview: boolean
}

type StatusRule = {
  /** Text the raw message starts with, in the carrier's own vocabulary. */
  pattern: string
  status: MilestoneStatus
}

/** Status names as shown in the rule label ("PICKED_UP → Picked up"). */
const STATUS_LABELS: Record<MilestoneStatus, string> = {
  booked: 'Booked',
  pickedUp: 'Picked up',
  departed: 'Departed',
  inTransit: 'In transit',
  arrived: 'Arrived',
  loadedOnVessel: 'Loaded on vessel',
  vesselRolled: 'Vessel rolled',
  customsHold: 'Customs hold',
  customsCleared: 'Customs cleared',
  delayed: 'Delayed',
  incident: 'Incident',
  outForDelivery: 'Out for delivery',
  delivered: 'Delivered',
}

/**
 * Rule tables per carrier id. Each carrier speaks its own vocabulary (API codes, EDI segments,
 * Spanish portal text), so a pattern is only valid for the carrier that sends it.
 */
const RULE_TABLES: ReadonlyArray<readonly [carrierId: string, rules: readonly StatusRule[]]> = [
  ['transauto', [
    { pattern: 'PICKUP CONFIRMED', status: 'pickedUp' },
    { pattern: 'IN TRANSIT', status: 'inTransit' },
    { pattern: 'DRIVER REST STOP', status: 'delayed' },
    { pattern: 'DELIVERED TO TERMINAL', status: 'arrived' },
    { pattern: 'OUT FOR DELIVERY', status: 'outForDelivery' },
    { pattern: 'DELIVERED', status: 'delivered' },
  ]],
  ['euroruta', [
    { pattern: 'BOOKING_CONFIRMED', status: 'booked' },
    { pattern: 'PICKED_UP', status: 'pickedUp' },
    { pattern: 'IN_TRANSIT', status: 'inTransit' },
    { pattern: 'DELIVERED_TO_TERMINAL', status: 'arrived' },
  ]],
  ['vascor-trans', [
    { pattern: 'Recogida realizada', status: 'pickedUp' },
    { pattern: 'En tránsito', status: 'inTransit' },
    { pattern: 'Entregado en terminal', status: 'arrived' },
    { pattern: 'Entregado', status: 'delivered' },
  ]],
  ['nordsee-line', [
    { pattern: 'IFTSTA LOADED ON BOARD', status: 'loadedOnVessel' },
    { pattern: 'IFTSTA VESSEL DEPARTURE', status: 'departed' },
    { pattern: 'IFTSTA POSITION REPORT', status: 'inTransit' },
    { pattern: 'IFTSTA DISCHARGED', status: 'arrived' },
  ]],
  ['mareline', [
    { pattern: 'CODECO GATE IN', status: 'arrived' },
    { pattern: 'CODECO ROLLED', status: 'vesselRolled' },
  ]],
]

/** The same tables with the longest pattern first, so "DELIVERED TO TERMINAL" wins over "DELIVERED". */
const RULES_BY_CARRIER: ReadonlyMap<string, readonly StatusRule[]> = new Map(
  RULE_TABLES.map(([carrierId, rules]) => [carrierId, orderBy(rules, [rule => rule.pattern.length], ['desc'])]),
)

/** Lower-cases and strips accents so "En tránsito" and "EN TRANSITO" are the same text. */
function toComparableText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * True when `text` starts with `pattern` as a whole word: the pattern must be followed by the end
 * of the text or a character that is not a letter, digit or underscore. This keeps `DELIVERED`
 * from matching `DELIVERED_TO_TERMINAL`.
 */
function startsWithWholePattern(text: string, pattern: string): boolean {
  if (!text.startsWith(pattern)) {
    return false
  }
  const rest = text.slice(pattern.length)
  return rest === '' || /^[^\p{L}\p{N}_]/u.test(rest)
}

/**
 * Maps a raw carrier message onto the normalised status list.
 *
 * The carrier's own rule table is tried first (deterministic, case and accent insensitive, longest
 * pattern wins). When no rule matches, the mapping already stored on the event is used: the
 * simulated AI status with its confidence. AI mappings below
 * {@link AI_REVIEW_THRESHOLD} are flagged for review.
 *
 * @example
 * normalizeStatus(event) // { status: 'pickedUp', mapping: { method: 'rule', rule: 'PICKED_UP → Picked up' }, needsReview: false }
 */
export function normalizeStatus(event: RawCarrierEvent): NormalizedEvent {
  const text = toComparableText(event.rawText)
  const rules = RULES_BY_CARRIER.get(event.carrierId) ?? []
  const matchedRule = rules.find(rule => startsWithWholePattern(text, toComparableText(rule.pattern)))

  if (matchedRule) {
    return {
      status: matchedRule.status,
      mapping: { method: 'rule', rule: `${matchedRule.pattern} → ${STATUS_LABELS[matchedRule.status]}` },
      needsReview: false,
    }
  }

  return {
    status: event.normalizedStatus,
    mapping: event.mapping,
    needsReview: event.mapping.method === 'ai' && event.mapping.confidence < AI_REVIEW_THRESHOLD,
  }
}
