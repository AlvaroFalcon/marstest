import { ChartLine, ClockAlert, Satellite, Truck, type LucideIcon } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'

const provenanceBadgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-caption font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        info: 'bg-info-subtle text-info',
        neutral: 'bg-muted text-muted-foreground',
        neutralStrong: 'bg-muted text-foreground',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type ProvenanceBadgeProps = {
  /**
   * What the data is. `estimated` with `compact` shows only the percentage (ops screens, where the
   * card label already says "Our estimate"); the word "Estimated" stays for screen readers.
   * `estimated` without `confidence` is a plain "Estimated" (a planned date has no precision).
   */
  kind:
    | { type: 'carrierEta' }
    | { type: 'estimated', confidence?: number, compact?: boolean }
    | { type: 'derivedFromGps' }
    | { type: 'noUpdate', hours: number }
  className?: string
}

type BadgeContent = {
  icon: LucideIcon
  tone: 'info' | 'neutral' | 'neutralStrong'
  label: string
  srOnlyPrefix?: string
}

function useBadgeContent(kind: ProvenanceBadgeProps['kind']): BadgeContent {
  const intl = useIntl()

  switch (kind.type) {
    case 'carrierEta':
      return { icon: Truck, tone: 'neutral', label: intl.formatMessage({ id: 'provenance.badge.carrierEta' }) }
    case 'derivedFromGps':
      return { icon: Satellite, tone: 'neutralStrong', label: intl.formatMessage({ id: 'provenance.badge.derivedFromGps' }) }
    case 'noUpdate':
      return { icon: ClockAlert, tone: 'neutral', label: intl.formatMessage({ id: 'provenance.badge.noUpdate' }, { hours: kind.hours }) }
    case 'estimated': {
      if (kind.confidence === undefined) {
        return { icon: ChartLine, tone: 'info', label: intl.formatMessage({ id: 'provenance.badge.estimatedNoPercent' }) }
      }

      const percent = intl.formatNumber(kind.confidence / 100, { style: 'percent' })
      if (kind.compact) {
        return {
          icon: ChartLine,
          tone: 'info',
          label: percent,
          srOnlyPrefix: intl.formatMessage({ id: 'provenance.badge.estimatedSrOnly' }),
        }
      }

      return { icon: ChartLine, tone: 'info', label: intl.formatMessage({ id: 'provenance.badge.estimated' }, { percent }) }
    }
  }
}

/**
 * Small label that tells where a piece of data comes from when it is not a plain carrier fact
 * (ADR 0028): "Carrier ETA", "Estimated · 78%", "Derived from GPS", "No update for 48 h". The
 * meaning is always carried by text (the icon is decorative), and the short percentage-only form
 * keeps "Estimated" available to assistive technology so an estimate never reads as a fact.
 */
export function ProvenanceBadge({ kind, className }: ProvenanceBadgeProps) {
  const { icon: Icon, tone, label, srOnlyPrefix } = useBadgeContent(kind)

  return (
    <span className={cn(provenanceBadgeVariants({ tone }), className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {srOnlyPrefix === undefined ? null : <span className="sr-only">{srOnlyPrefix}</span>}
      {label}
    </span>
  )
}
