import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useIntl } from 'react-intl'
import { ShipmentListStatusBadge } from '@/components/shipments/ShipmentListStatusBadge'
import { ShipmentConfidence, ShipmentEstimate, ShipmentUpdated } from '@/components/shipments/ShipmentRowCells'
import {
  formatShipmentCarrierEta,
  formatShipmentMilestone,
  formatShipmentRoute,
} from '@/components/shipments/shipmentRowPresentation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ShipmentListRow } from '@/lib/shipmentList'
import { cn } from '@/lib/utils'
import { formatShipmentModes, getCustomerShipmentHref } from './customerRowPresentation'

export type CustomerShipmentsTableProps = {
  rows: ShipmentListRow[]
  /** Injected clock for the "updated x ago" wording. */
  now: Date
  className?: string
}

/**
 * Desktop list of the customer's shipments, in the order received (no sorting). The shipment id
 * is a real link stretched over the row, giving one tab stop per row.
 */
export function CustomerShipmentsTable({ rows, now, className }: CustomerShipmentsTableProps) {
  const intl = useIntl()
  const { search } = useLocation()

  return (
    <Table aria-label={intl.formatMessage({ id: 'shipmentList.table.label' })} className={cn(className)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'customerShipments.column.shipment' })}</TableHead>
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'customerShipments.column.route' })}</TableHead>
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.column.milestone' })}</TableHead>
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.column.status' })}</TableHead>
          <TableHead className="text-caption font-semibold text-foreground">{intl.formatMessage({ id: 'shipmentList.column.carrierEta' })}</TableHead>
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.column.estimate' })}</TableHead>
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.column.confidence' })}</TableHead>
          <TableHead className="text-caption font-medium text-muted-foreground">{intl.formatMessage({ id: 'shipmentList.column.updated' })}</TableHead>
          <TableHead>
            <span className="sr-only">{intl.formatMessage({ id: 'customerShipments.column.open' })}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.id} className="relative">
            <TableCell className="py-3 whitespace-normal">
              <div className="flex flex-col">
                <Link
                  to={getCustomerShipmentHref(row, search)}
                  className="
                    font-semibold outline-hidden
                    after:absolute after:inset-0
                    focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset
                  "
                >
                  {row.id}
                </Link>
                <span className="text-muted-foreground">
                  {intl.formatMessage({ id: 'customerShipments.poNumber' }, { poNumber: row.poNumber })}
                </span>
              </div>
            </TableCell>
            <TableCell className="py-3 whitespace-normal">
              <div className="flex flex-col">
                <span className="font-medium">{formatShipmentRoute(intl, row)}</span>
                <span className="text-muted-foreground">{formatShipmentModes(intl, row)}</span>
              </div>
            </TableCell>
            <TableCell className="py-3 whitespace-normal">{formatShipmentMilestone(intl, row)}</TableCell>
            <TableCell className="py-3 whitespace-normal"><ShipmentListStatusBadge status={row.status} /></TableCell>
            <TableCell className="py-3 font-semibold">{formatShipmentCarrierEta(intl, row)}</TableCell>
            <TableCell className="py-3 whitespace-normal"><ShipmentEstimate row={row} /></TableCell>
            <TableCell className="py-3 whitespace-normal"><ShipmentConfidence row={row} /></TableCell>
            <TableCell className="py-3 whitespace-normal"><ShipmentUpdated row={row} now={now} /></TableCell>
            <TableCell className="py-3"><ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
