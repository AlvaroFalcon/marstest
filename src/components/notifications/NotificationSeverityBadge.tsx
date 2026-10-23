import { CircleCheck, CircleDot } from 'lucide-react'
import { useIntl } from 'react-intl'
import { ExceptionStatusBadge } from '@/components/exceptions/ExceptionStatusBadge'
import { EXCEPTION_STATUS_PRESENTATION } from '@/components/exceptions/exceptionStatusPresentation'
import { ShipmentListStatusBadge } from '@/components/shipments/ShipmentListStatusBadge'
import { Badge } from '@/components/ui/badge'
import type { NotificationSeverity } from '@/lib/notifications'
import { cn } from '@/lib/utils'

export type NotificationSeverityBadgeProps = {
  severity: NotificationSeverity
  className?: string
}

const BADGE_CLASS_NAME = 'h-6 px-2 text-caption'

type StaleTrackingBadgeProps = {
  className?: string
}

/** Stale tracking without hours: a notification does not know how long the shipment was silent. */
function StaleTrackingBadge({ className }: StaleTrackingBadgeProps) {
  const intl = useIntl()
  const { icon: Icon } = EXCEPTION_STATUS_PRESENTATION.staleTracking

  return (
    <Badge variant="secondary" className={cn(BADGE_CLASS_NAME, 'text-muted-foreground', className)}>
      <Icon aria-hidden="true" />
      {intl.formatMessage({ id: 'notifications.severity.noUpdate' })}
    </Badge>
  )
}

/**
 * Badge telling how serious a notification was, so a row can be triaged before it is opened.
 * Ops get the inbox badge of the exception an event opened; customers only get the customer
 * list's words ("At risk", "Delivered"), never ops vocabulary. Every kind has an icon and a
 * label, so severity never depends on colour alone.
 */
export function NotificationSeverityBadge({ severity, className }: NotificationSeverityBadgeProps) {
  const intl = useIntl()

  if (severity.kind === 'exception') {
    if (severity.exceptionType === 'staleTracking') {
      return <StaleTrackingBadge className={className} />
    }
    return <ExceptionStatusBadge status={{ type: severity.exceptionType }} className={className} />
  }

  if (severity.kind === 'atRisk' || severity.kind === 'delivered') {
    return <ShipmentListStatusBadge status={severity.kind} className={className} />
  }

  if (severity.kind === 'update') {
    return (
      <Badge variant="secondary" className={cn(BADGE_CLASS_NAME, 'text-muted-foreground', className)}>
        <CircleDot aria-hidden="true" />
        {intl.formatMessage({ id: 'notifications.severity.update' })}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={cn(BADGE_CLASS_NAME, 'bg-success-subtle text-success', className)}>
      <CircleCheck aria-hidden="true" />
      {intl.formatMessage({ id: severity.kind === 'resolved' ? 'notifications.severity.resolved' : 'notifications.severity.backOnTrack' })}
    </Badge>
  )
}
