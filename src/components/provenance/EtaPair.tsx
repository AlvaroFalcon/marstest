import type { ReactNode } from 'react'
import { useIntl, type IntlShape } from 'react-intl'
import type { CarrierEta, EstimatedEta } from '@/api/types'
import { compareEta } from '@/lib/eta'
import {
  getCarrierEtaUpdate,
  getEstimateComparisonNote,
  getEstimateRangeShape,
  type EstimateRangeShape,
} from '@/lib/provenance'
import { cn } from '@/lib/utils'
import { ProvenanceBadge } from './ProvenanceBadge'
import {
  formatCarrierChannel,
  formatElapsedTime,
  formatEstimateRange,
  formatEtaInstant,
  formatUtcDayAndTimeWithComma,
} from './formatProvenance'

export type EtaPairProps = {
  carrierEta: CarrierEta
  estimatedEta: EstimatedEta
  /** Display name of the carrier, resolved by the parent from the reference data. */
  carrierName: string
  /** Injected clock for the "updated X ago" wording. */
  now: Date
  /**
   * `reason` (exception detail, customer detail) explains the estimate with its "Why" and shows
   * "Estimated · 78%"; `comparison` (ops shipment detail) says how it relates to the carrier ETA
   * and shows only the percentage.
   */
  variant: 'reason' | 'comparison'
  className?: string
}

type EtaCardProps = {
  label: string
  /** Main value; the caller styles it through `valueClassName`. */
  value: string
  valueClassName?: string
  badge?: ReactNode
  note: string
  /** Highlights the card in the info colour; only used for an estimate that deviates. */
  isHighlighted?: boolean
}

/**
 * One of the two ETA cards: label, large value with an optional badge, and a one-line note.
 * Label, value and note are a description list so assistive technology reads them as a group.
 */
export function EtaCard({ label, value, valueClassName, badge, note, isHighlighted = false }: EtaCardProps) {
  return (
    <dl
      className={cn(
        'flex h-full flex-col gap-1.5 rounded-lg border bg-card px-5 py-4.5',
        isHighlighted && 'border-info',
      )}
    >
      <dt className="
        text-caption text-muted-foreground
        @xl:text-sm
      "
      >
        {label}
      </dt>
      <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn('text-eta font-medium', valueClassName)}>{value}</span>
        {badge}
      </dd>
      <dd className="
        text-caption text-muted-foreground
        @xl:text-sm
      "
      >
        {note}
      </dd>
    </dl>
  )
}

function getCarrierNote(intl: IntlShape, carrierEta: CarrierEta, carrierName: string, now: Date): string {
  if (carrierEta.status === 'notProvided') {
    return intl.formatMessage({ id: 'provenance.eta.notProvidedNote' }, { carrier: carrierName })
  }

  const channel = formatCarrierChannel(intl, carrierEta.source.channel)
  const update = getCarrierEtaUpdate(carrierEta.updatedAt, now)
  if (update.kind === 'recent') {
    return intl.formatMessage(
      { id: 'provenance.eta.source' },
      { carrier: carrierName, channel, ago: formatElapsedTime(intl, update.elapsed) },
    )
  }

  return intl.formatMessage(
    { id: 'provenance.eta.sourceUnchanged' },
    { carrier: carrierName, channel, since: formatUtcDayAndTimeWithComma(intl, update.since) },
  )
}

function getEstimateNote(
  intl: IntlShape,
  variant: EtaPairProps['variant'],
  carrierEta: CarrierEta,
  estimatedEta: EstimatedEta,
): string {
  const why = intl.formatMessage({ id: 'provenance.eta.why' }, { reason: estimatedEta.reason })
  if (variant === 'reason') return why

  const note = getEstimateComparisonNote(carrierEta, estimatedEta)
  switch (note.kind) {
    case 'inLine':
      return intl.formatMessage({ id: 'provenance.eta.inLine' })
    case 'deviatesHighConfidence':
      return intl.formatMessage(
        { id: 'provenance.eta.deviatesHighConfidence' },
        { hours: note.hours, direction: note.direction },
      )
    case 'deviatesLowConfidence':
      return intl.formatMessage({ id: 'provenance.eta.deviatesLowConfidence' })
    case 'reason':
      return intl.formatMessage({ id: 'provenance.eta.why' }, { reason: note.reason })
  }
}

type CarrierEtaCardProps = Pick<EtaPairProps, 'carrierEta' | 'carrierName' | 'now'> & { shape: EstimateRangeShape }

function CarrierEtaCard({ carrierEta, carrierName, now, shape }: CarrierEtaCardProps) {
  const intl = useIntl()
  const isProvided = carrierEta.status === 'provided'

  return (
    <EtaCard
      label={intl.formatMessage({ id: 'provenance.eta.carrierLabel' })}
      note={getCarrierNote(intl, carrierEta, carrierName, now)}
      value={isProvided
        ? formatEtaInstant(intl, carrierEta.date, shape)
        : intl.formatMessage({ id: 'provenance.eta.notProvided' })}
      valueClassName={isProvided ? undefined : 'text-muted-foreground'}
    />
  )
}

/**
 * Carrier ETA next to our own estimate (ADR 0026). The carrier card is always there, with its
 * source and freshness, or "Not provided" when the carrier sends no ETA. Our estimate always shows
 * a date range, its confidence and a note. Black means the estimate agrees with the carrier (or
 * there is nothing to compare with); blue, as a highlighted border plus blue date, means it
 * deviates: the highlight is backed by the note text, never colour alone. Both cards have equal
 * height; they sit side by side in wide containers and stack in narrow ones.
 */
export function EtaPair({ carrierEta, estimatedEta, carrierName, now, variant, className }: EtaPairProps) {
  const intl = useIntl()
  const shape = getEstimateRangeShape(estimatedEta)
  const isDeviating = compareEta(carrierEta, estimatedEta).kind === 'deviates'

  return (
    // The wrapper is the size container so cards can switch layout and fluid type scales by width.
    <div className={cn('@container', className)}>
      <div className="
        grid gap-3
        @xl:grid-cols-2 @xl:gap-5
      "
      >
        <CarrierEtaCard carrierEta={carrierEta} carrierName={carrierName} now={now} shape={shape} />
        <EtaCard
          badge={<ProvenanceBadge kind={{ type: 'estimated', confidence: estimatedEta.confidence, compact: variant === 'comparison' }} />}
          isHighlighted={isDeviating}
          label={intl.formatMessage({ id: 'provenance.eta.estimateLabel' })}
          note={getEstimateNote(intl, variant, carrierEta, estimatedEta)}
          value={formatEstimateRange(intl, estimatedEta, shape)}
          valueClassName={isDeviating ? 'text-info' : undefined}
        />
      </div>
    </div>
  )
}
