import { useIntl } from 'react-intl'
import type { ReactNode } from 'react'
import { CompactText } from '@/components/layout/CompactText'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export type ExceptionKpisProps = {
  /** Open exceptions in scope. */
  needAttention: number
  /** Undelivered shipments with no news for over 24 h. */
  staleOverDay: number
  /** Shipments classified on track. */
  onTime: number
  /** Every shipment in scope the on-time figure is measured against. */
  total: number
  className?: string
}

type KpiProps = {
  label: ReactNode
  value: ReactNode
}

function Kpi({ label, value }: KpiProps) {
  return (
    <div className="
      flex flex-col gap-1 rounded-lg border bg-card p-3 shadow-card
      @md:px-4
    "
    >
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-medium tabular-nums">{value}</dd>
    </div>
  )
}

/**
 * Three summary figures above the inbox. Labels and the on-time value switch to their compact copy
 * ("Attention", "Stale >24 h", "136/142") when the nearest container is narrow, via container
 * queries; the full and compact texts are both in the DOM but only one is displayed, so assistive
 * technology reads just the visible one.
 */
export function ExceptionKpis({ needAttention, staleOverDay, onTime, total, className }: ExceptionKpisProps) {
  const intl = useIntl()

  return (
    <dl
      aria-label={intl.formatMessage({ id: 'exceptionKpis.label' })}
      className={cn('grid grid-cols-3 gap-2', className)}
    >
      <Kpi
        label={(
          <>
            <CompactText compact={intl.formatMessage({ id: 'exceptionKpis.needAttentionShort' })} full={intl.formatMessage({ id: 'exceptionKpis.needAttention' })} />
          </>
        )}
        value={intl.formatNumber(needAttention)}
      />
      <Kpi
        label={(
          <>
            <CompactText compact={intl.formatMessage({ id: 'exceptionKpis.staleShort' })} full={intl.formatMessage({ id: 'exceptionKpis.stale' })} />
          </>
        )}
        value={intl.formatNumber(staleOverDay)}
      />
      <Kpi
        label={intl.formatMessage({ id: 'exceptionKpis.onTime' })}
        value={(
          <CompactText
            compact={intl.formatMessage({ id: 'exceptionKpis.onTimeValueShort' }, { onTime, total })}
            full={intl.formatMessage({ id: 'exceptionKpis.onTimeValue' }, { onTime, total })}
          />
        )}
      />
    </dl>
  )
}

export type ExceptionKpisSkeletonProps = {
  className?: string
}

/** Placeholder with the same grid as {@link ExceptionKpis}, shown while the figures load. */
export function ExceptionKpisSkeleton({ className }: ExceptionKpisSkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('grid grid-cols-3 gap-2', className)}>
      <Skeleton className="h-18" />
      <Skeleton className="h-18" />
      <Skeleton className="h-18" />
    </div>
  )
}
