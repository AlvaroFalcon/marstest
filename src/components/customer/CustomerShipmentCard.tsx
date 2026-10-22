import { Link, useLocation } from 'react-router'
import { useIntl } from 'react-intl'
import { ShipmentListStatusBadge } from '@/components/shipments/ShipmentListStatusBadge'
import { ShipmentConfidence, ShipmentEstimate, ShipmentUpdated } from '@/components/shipments/ShipmentRowCells'
import {
  formatShipmentCarrierEta,
  formatShipmentMilestone,
  formatShipmentRoute,
} from '@/components/shipments/shipmentRowPresentation'
import type { ShipmentListRow } from '@/lib/shipmentList'
import { cn } from '@/lib/utils'
import { formatShipmentModes, getCustomerShipmentHref } from './customerRowPresentation'

export type CustomerShipmentCardProps = {
  row: ShipmentListRow
  /** Injected clock for the "updated x ago" wording. */
  now: Date
  className?: string
}

/** One shipment of the customer list on narrow screens; the whole card links to the detail. */
export function CustomerShipmentCard({ row, now, className }: CustomerShipmentCardProps) {
  const intl = useIntl()
  const { search } = useLocation()

  return (
    <Link
      to={getCustomerShipmentHref(row, search)}
      className={cn(
        `
          flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm shadow-card outline-hidden transition-colors
          hover:bg-accent
          focus-visible:ring-3 focus-visible:ring-ring
        `,
        className,
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-medium">
          {intl.formatMessage({ id: 'customerShipments.card.title' }, { shipmentId: row.id, poNumber: row.poNumber })}
        </span>
        <ShipmentListStatusBadge status={row.status} />
      </span>
      <span className="text-base font-semibold">{formatShipmentRoute(intl, row)}</span>
      <span className="text-muted-foreground">{formatShipmentModes(intl, row)}</span>
      <span className="text-muted-foreground">{formatShipmentMilestone(intl, row)}</span>
      <span className="flex items-end justify-between gap-3 border-t pt-2">
        <span className="flex flex-col gap-0.5">
          <span className="flex gap-2">
            <span className="w-16 text-muted-foreground">{intl.formatMessage({ id: 'customerShipments.card.carrier' })}</span>
            <span>{formatShipmentCarrierEta(intl, row)}</span>
          </span>
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="w-16 text-muted-foreground">{intl.formatMessage({ id: 'customerShipments.card.estimate' })}</span>
            <ShipmentEstimate row={row} />
            <ShipmentConfidence row={row} />
          </span>
        </span>
        <ShipmentUpdated row={row} now={now} className="shrink-0 text-caption" />
      </span>
    </Link>
  )
}
