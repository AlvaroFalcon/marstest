import type { IntlShape } from 'react-intl'
import type { JourneyConnector, JourneyStep, JourneyStepProvenance } from '@/lib/journey'
import { getEstimateRangeShape } from '@/lib/provenance'
import { formatEstimateRange, formatUtcDay } from '@/components/provenance/formatProvenance'
import type { ProvenanceBadgeProps } from '@/components/provenance/ProvenanceBadge'

function getFutureMessageId(position: JourneyStep['position']) {
  if (position === 'origin') return 'journey.future.departure'
  if (position === 'destination') return 'journey.future.delivery'

  return 'journey.future.arrival'
}

/**
 * Builds the muted line under a node title: "Picked up · Oct 14", "Arrival ~ Oct 23",
 * "Delivery ~ Oct 24–25" or "Overdue since Oct 19". Returns an empty string when a passed step has
 * neither a status nor a date, so the caller can skip the line.
 */
export function formatStepSubline(intl: IntlShape, step: JourneyStep): string {
  const { date, status, position } = step
  const statusLabel = status === null ? '' : intl.formatMessage({ id: `journey.status.${status}` })

  switch (date.kind) {
    case 'occurred': {
      const day = formatUtcDay(intl, date.at)
      return statusLabel === '' ? day : intl.formatMessage({ id: 'journey.subline' }, { status: statusLabel, date: day })
    }
    case 'none':
      return statusLabel
    case 'planned':
    case 'carrierEta':
      return intl.formatMessage({ id: getFutureMessageId(position) }, { date: formatUtcDay(intl, date.at) })
    case 'overdue':
      return intl.formatMessage({ id: 'journey.overdue' }, { date: formatUtcDay(intl, date.plannedAt) })
    case 'estimate':
      return intl.formatMessage(
        { id: getFutureMessageId(position) },
        { date: formatEstimateRange(intl, date.estimate, getEstimateRangeShape(date.estimate)) },
      )
  }
}

/** Badge for a step, or `null` when the step is plain carrier data (ADR 0028). */
export function getStepBadgeKind(provenance: JourneyStepProvenance): ProvenanceBadgeProps['kind'] | null {
  switch (provenance.kind) {
    case 'none':
      return null
    case 'carrierEta':
      return { type: 'carrierEta' }
    case 'estimated':
      return { type: 'estimated', confidence: provenance.confidence }
    case 'derivedFromGps':
      return { type: 'derivedFromGps' }
  }
}

/** "Road · Transauto" or "Sea · Mareline". Falls back to the carrier id when the name is unknown. */
export function formatConnectorLabel(
  intl: IntlShape,
  connector: JourneyConnector,
  carrierNames: Readonly<Record<string, string>>,
): string {
  return intl.formatMessage(
    { id: `journey.connector.${connector.mode}` },
    { carrier: carrierNames[connector.carrierId] ?? connector.carrierId },
  )
}
