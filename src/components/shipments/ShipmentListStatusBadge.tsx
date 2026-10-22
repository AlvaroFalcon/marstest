import { useIntl } from 'react-intl'
import { CalendarClock, CircleCheck, ClockAlert, PackageCheck, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ShipmentListStatus } from '@/lib/shipmentList'
import type { MessageId } from '@/locales/en'
import { cn } from '@/lib/utils'

export type ShipmentListStatusBadgeProps = {
  status: ShipmentListStatus
  className?: string
}

type StatusPresentation = {
  icon: LucideIcon
  labelId: MessageId
  variant: 'destructive' | 'secondary'
  className: string
}

const STATUS_PRESENTATION = {
  atRisk: { icon: TriangleAlert, labelId: 'shipmentList.status.atRisk', variant: 'destructive', className: '' },
  stale: { icon: ClockAlert, labelId: 'shipmentList.status.stale', variant: 'secondary', className: 'bg-warning-subtle text-warning' },
  onTime: { icon: CircleCheck, labelId: 'shipmentList.status.onTime', variant: 'secondary', className: 'bg-success-subtle text-success' },
  scheduled: { icon: CalendarClock, labelId: 'shipmentList.status.scheduled', variant: 'secondary', className: 'text-muted-foreground' },
  delivered: { icon: PackageCheck, labelId: 'shipmentList.status.delivered', variant: 'secondary', className: 'text-muted-foreground' },
} satisfies Record<ShipmentListStatus, StatusPresentation>

/**
 * Badge with the single status of a shipment in the list ("At risk", "No recent update", ...).
 * Every status has its own icon and label, so it is never told by colour alone.
 */
export function ShipmentListStatusBadge({ status, className }: ShipmentListStatusBadgeProps) {
  const intl = useIntl()
  const { icon: Icon, labelId, variant, className: toneClassName } = STATUS_PRESENTATION[status]

  return (
    <Badge variant={variant} className={cn('h-6 px-2 text-caption', toneClassName, className)}>
      <Icon aria-hidden="true" />
      {intl.formatMessage({ id: labelId })}
    </Badge>
  )
}
