import { Link, useLocation } from 'react-router'
import { useIntl } from 'react-intl'
import type { ShipmentListRow } from '@/lib/shipmentList'
import { cn } from '@/lib/utils'
import { ShipmentListStatusBadge } from './ShipmentListStatusBadge'
import { ShipmentConfidence, ShipmentEstimate, ShipmentUpdated } from './ShipmentRowCells'
import {
  formatShipmentCarrierEta,
  formatShipmentCarriers,
  formatShipmentMilestone,
  formatShipmentRoute,
  getShipmentRowHref,
} from './shipmentRowPresentation'

export type ShipmentCardProps = {
  row: ShipmentListRow
  /** Injected clock for the "updated x ago" wording. */
  now: Date
  className?: string
}

/**
 * One shipment of the list on narrow screens: the whole card is the link to its detail. Shows the
 * same data as a table row, regrouped for reading in a column: identity and status, route,
 * milestone, then the two ETAs with confidence.
 */
export function ShipmentCard({ row, now, className }: ShipmentCardProps) {
  const intl = useIntl()
  const { search } = useLocation()

  return (
    <Link
      to={getShipmentRowHref(row, search)}
      className={cn(
        `
          flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm shadow-card outline-hidden transition-colors
          hover:bg-accent
          focus-visible:ring-3 focus-visible:ring-ring/50
        `,
        className,
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-medium">
          {intl.formatMessage({ id: 'shipmentList.card.title' }, { shipmentId: row.id, customer: row.customerName })}
        </span>
        <ShipmentListStatusBadge status={row.status} />
      </span>
      <span className="text-base font-semibold">{formatShipmentRoute(intl, row)}</span>
      <span className="text-muted-foreground">{formatShipmentCarriers(row)}</span>
      <span className="text-muted-foreground">{formatShipmentMilestone(intl, row)}</span>
      <span className="flex items-end justify-between gap-3 border-t pt-2">
        <span className="flex flex-col gap-0.5">
          <span className="flex gap-2">
            <span className="w-16 text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.card.carrier' })}</span>
            <span>{formatShipmentCarrierEta(intl, row)}</span>
          </span>
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="w-16 text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.card.estimate' })}</span>
            <ShipmentEstimate row={row} />
            <ShipmentConfidence row={row} />
          </span>
        </span>
        <ShipmentUpdated row={row} now={now} className="shrink-0 text-caption" />
      </span>
    </Link>
  )
}
