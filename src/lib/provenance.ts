import type { CarrierEta, EstimatedEta } from '@/api/types'
import { compareEta } from '@/lib/eta'
import { CONFIDENCE_THRESHOLD, MILLISECONDS_PER_HOUR, STALE_AFTER_HOURS } from '@/lib/thresholds'

const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const MILLISECONDS_PER_MINUTE = 60_000
/** Up to this many hours (exclusive) elapsed time is still shown in hours; beyond it, in days. */
const HOURS_BEFORE_SWITCHING_TO_DAYS = 48

/** A whole number of minutes, hours or days; the UI picks the wording through react-intl. */
export type ElapsedTime = { unit: 'minutes' | 'hours' | 'days', value: number }

/**
 * Compact elapsed time for "updated 3 min ago" style labels: minutes under 1 hour, hours under
 * 48 hours, days otherwise. Values are floored so a label never overstates how recent data is.
 *
 * @param now - Injected for deterministic tests.
 * @returns `{ unit: 'minutes', value: 0 }` when `fromIso` is not before `now`.
 */
export function getElapsedTime(fromIso: string, now: Date): ElapsedTime {
  const elapsedMilliseconds = now.getTime() - Date.parse(fromIso)

  if (elapsedMilliseconds <= 0) {
    return { unit: 'minutes', value: 0 }
  }

  const elapsedMinutes = Math.floor(elapsedMilliseconds / MILLISECONDS_PER_MINUTE)

  if (elapsedMinutes < MINUTES_PER_HOUR) {
    return { unit: 'minutes', value: elapsedMinutes }
  }

  const elapsedHours = Math.floor(elapsedMilliseconds / MILLISECONDS_PER_HOUR)

  if (elapsedHours < HOURS_BEFORE_SWITCHING_TO_DAYS) {
    return { unit: 'hours', value: elapsedHours }
  }

  return { unit: 'days', value: Math.floor(elapsedHours / HOURS_PER_DAY) }
}

/**
 * What to say about the last time the carrier touched its ETA: how long ago when recent, or the
 * moment since which it has not changed when it is stale (ADR 0043 threshold).
 */
export type CarrierEtaUpdate
  = | { kind: 'recent', elapsed: ElapsedTime }
    | { kind: 'unchanged', since: string }

/**
 * Classifies the carrier ETA update. Older than {@link STALE_AFTER_HOURS} hours is `unchanged`;
 * exactly that many hours is still `recent`, like in `getFreshness`.
 *
 * @param updatedAt - ISO date-time of the carrier's last ETA update.
 * @param now - Injected for deterministic tests.
 */
export function getCarrierEtaUpdate(updatedAt: string, now: Date): CarrierEtaUpdate {
  const hoursSinceUpdate = (now.getTime() - Date.parse(updatedAt)) / MILLISECONDS_PER_HOUR

  if (hoursSinceUpdate > STALE_AFTER_HOURS) {
    return { kind: 'unchanged', since: updatedAt }
  }

  return { kind: 'recent', elapsed: getElapsedTime(updatedAt, now) }
}

/** The sentence under our estimate that explains how it relates to the carrier ETA. */
export type EstimateComparisonNote
  = | { kind: 'inLine' }
    | { kind: 'deviatesHighConfidence', hours: number, direction: 'later' | 'earlier' }
    | { kind: 'deviatesLowConfidence' }
    | { kind: 'reason', reason: string }

/**
 * Picks the note of the ops "comparison" variant. The in-line decision is delegated to
 * `compareEta` so the tolerance lives in one place (ADR 0042).
 *
 * @returns `reason` when the carrier gave no ETA: there is nothing to compare, so we show why we
 * estimate what we do.
 */
export function getEstimateComparisonNote(carrierEta: CarrierEta, estimatedEta: EstimatedEta): EstimateComparisonNote {
  const comparison = compareEta(carrierEta, estimatedEta)

  switch (comparison.kind) {
    case 'inLine':
      return { kind: 'inLine' }
    case 'noCarrierEta':
      return { kind: 'reason', reason: estimatedEta.reason }
    case 'deviates':
      if (estimatedEta.confidence < CONFIDENCE_THRESHOLD) {
        return { kind: 'deviatesLowConfidence' }
      }
      return {
        kind: 'deviatesHighConfidence',
        hours: Math.round(Math.abs(comparison.deltaHours)),
        direction: comparison.deltaHours > 0 ? 'later' : 'earlier',
      }
  }
}

/**
 * How the estimate range is written: times on a single day, times across two days, or dates only.
 */
export type EstimateRangeShape = 'sameDayTimes' | 'acrossDaysTimes' | 'days'

/**
 * Chooses the precision of the estimate range. Days are compared in UTC, the zone every date of
 * the prototype is shown in. A span of 24 hours or more is too wide for times to mean anything.
 */
export function getEstimateRangeShape(estimatedEta: EstimatedEta): EstimateRangeShape {
  const earliestTime = Date.parse(estimatedEta.earliest)
  const latestTime = Date.parse(estimatedEta.latest)

  if ((latestTime - earliestTime) / MILLISECONDS_PER_HOUR >= HOURS_PER_DAY) {
    return 'days'
  }

  const earliestUtcDay = new Date(earliestTime).toISOString().slice(0, 10)
  const latestUtcDay = new Date(latestTime).toISOString().slice(0, 10)

  return earliestUtcDay === latestUtcDay ? 'sameDayTimes' : 'acrossDaysTimes'
}
