import { useIntl } from 'react-intl'
import type { Freshness } from '@/lib/freshness'
import { getElapsedTime } from '@/lib/provenance'
import { cn } from '@/lib/utils'
import { ProvenanceBadge } from './ProvenanceBadge'
import { formatElapsedTime } from './formatProvenance'

export type FreshnessIndicatorProps = {
  freshness: Freshness
  /** Injected clock, so the same render is reproducible (the demo clock is frozen). */
  now: Date
  className?: string
}

/**
 * Tells how recent the tracking data is. Fresh data is plain muted text ("Updated 2 h ago");
 * stale data (more than 24 h without news) becomes a badge with an icon and the hours, so it
 * stands out without relying on colour. Delivered shipments never get news again, so nothing is
 * rendered for them.
 */
export function FreshnessIndicator({ freshness, now, className }: FreshnessIndicatorProps) {
  const intl = useIntl()

  if (freshness.kind === 'notApplicable') return null
  if (freshness.kind === 'stale') {
    return <ProvenanceBadge className={className} kind={{ type: 'noUpdate', hours: Math.floor(freshness.hoursSinceUpdate) }} />
  }

  const ago = formatElapsedTime(intl, getElapsedTime(freshness.lastUpdateAt, now))

  return (
    <span className={cn('text-sm text-muted-foreground', className)}>
      {intl.formatMessage({ id: 'provenance.freshness.updated' }, { ago })}
    </span>
  )
}
