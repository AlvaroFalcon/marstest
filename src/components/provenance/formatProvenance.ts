import type { IntlShape } from 'react-intl'
import type { CarrierChannel, EstimatedEta } from '@/api/types'
import type { ElapsedTime, EstimateRangeShape } from '@/lib/provenance'

const UTC_DAY_OPTIONS = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const
// h23 avoids "24:00" at midnight, which the en-US 24-hour clock would otherwise produce.
const UTC_TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' } as const

/**
 * Compact relative time ("3 min ago", "2 h ago", "3 d ago") from an already floored
 * {@link ElapsedTime}.
 */
export function formatElapsedTime(intl: IntlShape, elapsed: ElapsedTime): string {
  return intl.formatMessage({ id: `provenance.ago.${elapsed.unit}` }, { value: elapsed.value })
}

/** Label of a carrier channel ("API", "EDI", "Email", "Portal"). */
export function formatCarrierChannel(intl: IntlShape, channel: CarrierChannel): string {
  return intl.formatMessage({ id: `provenance.channel.${channel}` })
}

/** UTC calendar day and time of an instant, e.g. "Oct 19, 09:00". */
export function formatUtcDayAndTimeWithComma(intl: IntlShape, iso: string): string {
  return intl.formatMessage({ id: 'provenance.eta.unchangedSince' }, {
    day: intl.formatDate(iso, UTC_DAY_OPTIONS),
    time: intl.formatTime(iso, UTC_TIME_OPTIONS),
  })
}

/**
 * Single instant at the precision of the estimate shown next to it: date only for multi-day
 * estimates, otherwise date and time ("Oct 21 · 10:00").
 */
export function formatEtaInstant(intl: IntlShape, iso: string, shape: EstimateRangeShape): string {
  const day = intl.formatDate(iso, UTC_DAY_OPTIONS)
  if (shape === 'days') return day

  return intl.formatMessage({ id: 'provenance.date.dayAndTime' }, { day, time: intl.formatTime(iso, UTC_TIME_OPTIONS) })
}

/**
 * Earliest-latest window of our estimate in UTC, shaped by {@link EstimateRangeShape}:
 * "Oct 21 · 10:00–13:00", "Oct 21 15:00 – Oct 22 10:00" or "Oct 24–25".
 */
export function formatEstimateRange(intl: IntlShape, estimatedEta: EstimatedEta, shape: EstimateRangeShape): string {
  const { earliest, latest } = estimatedEta
  const startDay = intl.formatDate(earliest, UTC_DAY_OPTIONS)
  const endDay = intl.formatDate(latest, UTC_DAY_OPTIONS)
  const startTime = intl.formatTime(earliest, UTC_TIME_OPTIONS)
  const endTime = intl.formatTime(latest, UTC_TIME_OPTIONS)

  if (shape === 'sameDayTimes') {
    return intl.formatMessage({ id: 'provenance.date.sameDayTimes' }, { day: startDay, start: startTime, end: endTime })
  }
  if (shape === 'acrossDaysTimes') {
    return intl.formatMessage({ id: 'provenance.date.acrossDaysTimes' }, { startDay, startTime, endDay, endTime })
  }
  if (startDay === endDay) return startDay

  const startMonth = intl.formatDate(earliest, { month: 'short', timeZone: 'UTC' })
  const endMonth = intl.formatDate(latest, { month: 'short', timeZone: 'UTC' })
  if (startMonth === endMonth) {
    return intl.formatMessage({ id: 'provenance.date.daysSameMonth' }, {
      startDay,
      endDay: intl.formatDate(latest, { day: 'numeric', timeZone: 'UTC' }),
    })
  }

  return intl.formatMessage({ id: 'provenance.date.daysAcrossMonths' }, { startDay, endDay })
}

/** One kind of source an AI statement is based on, with how many of them. */
export type EvidenceCount = {
  kind: 'events' | 'carrierEvents' | 'documents' | 'gpsPings' | 'trafficFeeds'
  count: number
}

/**
 * Builds the "Based on 6 events and 4 documents" label. Accepts one or two kinds of evidence;
 * plurals are handled by the messages.
 */
export function formatEvidenceLabel(intl: IntlShape, first: EvidenceCount, second?: EvidenceCount): string {
  const describe = (evidence: EvidenceCount) =>
    intl.formatMessage({ id: `provenance.evidence.${evidence.kind}` }, { count: evidence.count })
  const items = second === undefined
    ? describe(first)
    : intl.formatMessage({ id: 'provenance.evidence.pair' }, { first: describe(first), second: describe(second) })

  return intl.formatMessage({ id: 'provenance.evidence.based' }, { items })
}
