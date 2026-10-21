import { useIntl } from 'react-intl'
import type { ExceptionType } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { EXCEPTION_STATUS_PRESENTATION, type ExceptionTone } from '@/components/exceptions/exceptionStatusPresentation'

/**
 * What the badge needs to know about an exception. Stale tracking carries the whole hours without
 * news (resolved by the parent from the freshness of the shipment); the other types need nothing.
 */
export type ExceptionStatus
  = | { type: Exclude<ExceptionType, 'staleTracking'> }
    | { type: 'staleTracking', staleHours: number }

export type ExceptionStatusBadgeProps = {
  status: ExceptionStatus
  className?: string
}

const toneClassName = {
  critical: '',
  warning: 'bg-warning-subtle text-warning',
  neutral: 'text-muted-foreground',
} satisfies Record<ExceptionTone, string>

const toneVariant = {
  critical: 'destructive',
  warning: 'secondary',
  neutral: 'secondary',
} as const satisfies Record<ExceptionTone, 'destructive' | 'secondary'>

/**
 * Badge with the kind of an exception ("Customs hold", "Delayed", "No update 48 h"). Every type
 * has its own icon and label, so the severity never depends on colour alone.
 */
export function ExceptionStatusBadge({ status, className }: ExceptionStatusBadgeProps) {
  const intl = useIntl()
  const { tone, icon: Icon, labelId } = EXCEPTION_STATUS_PRESENTATION[status.type]
  const label = status.type === 'staleTracking'
    ? intl.formatMessage({ id: labelId }, { hours: status.staleHours })
    : intl.formatMessage({ id: labelId })

  return (
    <Badge
      variant={toneVariant[tone]}
      className={cn('h-6 px-2 text-caption', toneClassName[tone], className)}
    >
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  )
}
