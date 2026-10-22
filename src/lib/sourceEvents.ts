import { orderBy } from 'es-toolkit'
import type { EventMapping, MilestoneStatus, RawCarrierEvent } from '@/api/types'
import { normalizeStatus } from '@/lib/normalizeStatus'

const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

/**
 * Time between two consecutive source events, split for display. At 24 h or more only `days` and
 * `hours` are set (minutes are noise at that scale); below that `days` is 0 and `minutes` is kept.
 */
export type EventTimeDelta = {
  days: number
  hours: number
  minutes: number
}

/** One carrier message prepared for the source events sheet. */
export type SourceEventRow = {
  id: string
  carrierId: string
  channel: RawCarrierEvent['channel']
  /** ISO instant we received the message; the list is ordered by it. */
  receivedAt: string
  /** The message exactly as the carrier sent it. */
  rawText: string
  /** Normalised status, the one the mapping produces today. */
  status: MilestoneStatus
  mapping: EventMapping
  /** True for AI mappings below the review threshold: a human must confirm the status. */
  needsReview: boolean
  /** True when the AI diagnosis of the open exception cites this event. */
  isCited: boolean
  /** Time since the previous (older) event; `null` for the first one. */
  deltaFromPrevious: EventTimeDelta | null
}

/**
 * Splits a duration between two instants into the parts the sheet shows ("+1 d 21 h", "+2 h 25 min",
 * "+45 min"). Seconds are floored.
 *
 * @returns A zero delta when `to` is not after `from`; events are ordered, so this only guards
 * against equal timestamps.
 *
 * @example
 * computeEventTimeDelta('2026-10-16T09:14:00Z', '2026-10-17T10:30:00Z') // { days: 1, hours: 1, minutes: 0 }
 */
export function computeEventTimeDelta(from: string, to: string): EventTimeDelta {
  const totalMinutes = Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / 60_000))
  const totalHours = Math.floor(totalMinutes / MINUTES_PER_HOUR)

  if (totalHours >= HOURS_PER_DAY) {
    return { days: Math.floor(totalHours / HOURS_PER_DAY), hours: totalHours % HOURS_PER_DAY, minutes: 0 }
  }

  return { days: 0, hours: totalHours, minutes: totalMinutes % MINUTES_PER_HOUR }
}

/**
 * Builds the rows of the source events sheet: every raw event of the shipment, oldest first, each
 * with its normalised status, review flag and the gap to the previous event. All events are listed
 * (not only the cited ones) so ops can audit the whole stream; the cited ones are only marked.
 *
 * @param citedEventIds - Ids the AI diagnosis is based on.
 */
export function buildSourceEventRows(rawEvents: readonly RawCarrierEvent[], citedEventIds: readonly string[]): SourceEventRow[] {
  const citedIds = new Set(citedEventIds)
  const ordered = orderBy(rawEvents, [event => Date.parse(event.receivedAt)], ['asc'])

  return ordered.map((event, index) => {
    const normalized = normalizeStatus(event)
    const previous = index === 0 ? undefined : ordered[index - 1]

    return {
      id: event.id,
      carrierId: event.carrierId,
      channel: event.channel,
      receivedAt: event.receivedAt,
      rawText: event.rawText,
      status: normalized.status,
      mapping: normalized.mapping,
      needsReview: normalized.needsReview,
      isCited: citedIds.has(event.id),
      deltaFromPrevious: previous === undefined ? null : computeEventTimeDelta(previous.receivedAt, event.receivedAt),
    }
  })
}
