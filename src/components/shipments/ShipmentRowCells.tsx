import { useIntl } from 'react-intl'
import { ClockAlert, Sparkles } from 'lucide-react'
import type { ShipmentListRow } from '@/lib/shipmentList'
import { cn } from '@/lib/utils'
import { formatShipmentEstimate, formatShipmentUpdated } from './shipmentRowPresentation'

export type ShipmentRowCellProps = {
  row: ShipmentListRow
  className?: string
}

type NotApplicableProps = {
  className?: string
}

/** A dash for a value that does not apply, with a text alternative for assistive technology. */
function NotApplicable({ className }: NotApplicableProps) {
  const intl = useIntl()

  return (
    <span className={className}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{intl.formatMessage({ id: 'shipmentList.notApplicable' })}</span>
    </span>
  )
}

/**
 * Our estimate window of a row. A deviating estimate is highlighted in the info colour (it is
 * also the reason for the confidence next to it); a delivered shipment has none.
 */
export function ShipmentEstimate({ row, className }: ShipmentRowCellProps) {
  const intl = useIntl()
  const estimate = formatShipmentEstimate(intl, row)

  if (estimate === null) {
    return <NotApplicable className={className} />
  }
  return <span className={cn(row.isEstimateDeviating && 'font-medium text-info', className)}>{estimate}</span>
}

/** Confidence of our estimate with a sparkle marking it as AI-made; delivered shipments have none. */
export function ShipmentConfidence({ row, className }: ShipmentRowCellProps) {
  const intl = useIntl()

  if (row.confidence === null) {
    return <NotApplicable className={className} />
  }
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
      <Sparkles aria-hidden="true" className="size-3.5 text-muted-foreground" />
      {intl.formatMessage({ id: 'shipmentList.confidenceValue' }, { value: row.confidence })}
    </span>
  )
}

export type ShipmentUpdatedProps = ShipmentRowCellProps & {
  /** Injected clock for the "x h ago" wording. */
  now: Date
}

/**
 * Time since the last update. Stale tracking gets the warning colour and an icon plus a hidden
 * sentence, so it does not rely on colour; a delivered shipment reads "Final".
 */
export function ShipmentUpdated({ row, now, className }: ShipmentUpdatedProps) {
  const intl = useIntl()
  const updated = formatShipmentUpdated(intl, row, now)

  if (updated === null) {
    return <span className={cn('text-muted-foreground', className)}>{intl.formatMessage({ id: 'shipmentList.final' })}</span>
  }
  if (row.freshness.kind === 'stale') {
    return (
      <span className={cn('inline-flex items-center gap-1 font-medium whitespace-nowrap text-warning', className)}>
        <ClockAlert aria-hidden="true" className="size-3.5" />
        <span className="sr-only">{intl.formatMessage({ id: 'shipmentList.staleUpdate' })}</span>
        {updated}
      </span>
    )
  }
  return <span className={cn('whitespace-nowrap text-muted-foreground', className)}>{updated}</span>
}
