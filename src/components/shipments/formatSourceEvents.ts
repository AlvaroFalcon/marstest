import type { IntlShape } from 'react-intl'
import type { EventMapping, MilestoneStatus } from '@/api/types'
import { formatEtaInstant } from '@/components/provenance/formatProvenance'
import type { EventTimeDelta } from '@/lib/sourceEvents'

/** Time a message was received in UTC, like the rest of the app: "Oct 16 · 09:14". */
export function formatEventReceivedAt(intl: IntlShape, iso: string): string {
  return formatEtaInstant(intl, iso, 'sameDayTimes')
}

/** Gap between two events: "+1 d 21 h" from 24 h on, otherwise "+2 h 25 min" or "+45 min". Zero parts are dropped. */
export function formatEventTimeDelta(intl: IntlShape, delta: EventTimeDelta): string {
  if (delta.days > 0) {
    return delta.hours === 0
      ? intl.formatMessage({ id: 'sourceEvents.delta.days' }, { days: delta.days })
      : intl.formatMessage({ id: 'sourceEvents.delta.daysHours' }, delta)
  }
  if (delta.hours > 0) {
    return delta.minutes === 0
      ? intl.formatMessage({ id: 'sourceEvents.delta.hours' }, { hours: delta.hours })
      : intl.formatMessage({ id: 'sourceEvents.delta.hoursMinutes' }, delta)
  }
  return intl.formatMessage({ id: 'sourceEvents.delta.minutes' }, { minutes: delta.minutes })
}

/** "Mapped by rule" or "Mapped by AI · 92% confidence". */
export function formatEventMapping(intl: IntlShape, mapping: EventMapping): string {
  return mapping.method === 'rule'
    ? intl.formatMessage({ id: 'sourceEvents.mapping.rule' })
    : intl.formatMessage({ id: 'sourceEvents.mapping.ai' }, { percent: mapping.confidence })
}

/** Warning for a low-confidence AI mapping: "AI 54% · below threshold, needs human review". */
export function formatLowConfidence(intl: IntlShape, confidence: number): string {
  return intl.formatMessage({ id: 'sourceEvents.lowConfidence' }, { percent: confidence })
}

/** Normalised status name; with `needsReview` it ends with "?" ("Delayed?") to show it is unconfirmed. */
export function formatEventStatus(intl: IntlShape, status: MilestoneStatus, needsReview: boolean): string {
  const label = intl.formatMessage({ id: `journey.status.${status}` })
  return needsReview ? intl.formatMessage({ id: 'sourceEvents.reviewStatus' }, { status: label }) : label
}
