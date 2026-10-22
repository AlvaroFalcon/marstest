import { Link } from 'react-router'
import { useIntl } from 'react-intl'
import { Check } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ExceptionStatusBadge, type ExceptionStatus } from '@/components/exceptions/ExceptionStatusBadge'
import { EXCEPTION_STATUS_PRESENTATION } from '@/components/exceptions/exceptionStatusPresentation'

export type ExceptionCardProps = {
  shipmentId: string
  /** Origin city and destination city, already joined ("Zaragoza → Hamburg"). */
  route: string
  /** First sentence of the AI diagnosis. */
  reason: string
  status: ExceptionStatus
  /** Detail URL, built by the parent so the card knows no routes and keeps the current search string. */
  href: string
  /** True when this exception is the one open in the detail panel. */
  isOpen: boolean
  /** True when the customer notice was sent; the exception stays in the inbox, so the card says so. */
  isCustomerNotified: boolean
  /** True while ops have not opened this exception since it was raised by a carrier event. */
  isNew: boolean
  className?: string
}

const cardVariants = cva(
  `
    relative flex flex-col items-start gap-1.5 overflow-hidden rounded-xl border bg-card py-3 pr-4 pl-5 text-sm
    shadow-card outline-hidden transition-colors
    before:absolute before:inset-y-0 before:left-0 before:w-1
    hover:not-aria-[current=page]:bg-accent
    focus-visible:ring-3 focus-visible:ring-ring
    aria-[current=page]:border-info aria-[current=page]:bg-info-subtle
  `,
  {
    variants: {
      tone: {
        critical: 'before:bg-destructive',
        warning: 'before:bg-warning',
        neutral: 'before:bg-muted-foreground',
      },
    },
  },
)

/**
 * One open exception of the inbox, as a link to its detail. The left bar and the badge both carry
 * the severity (the badge has icon and text, so colour is not the only signal); the open card gets
 * the info background and `aria-current="page"`, which also tells screen readers which one is open.
 * A new exception carries a "New" text badge in the info tone, so the marker is not colour-only.
 */
export function ExceptionCard({ shipmentId, route, reason, status, href, isOpen, isCustomerNotified, isNew, className }: ExceptionCardProps) {
  const intl = useIntl()
  const { tone } = EXCEPTION_STATUS_PRESENTATION[status.type]

  return (
    <Link
      to={href}
      aria-current={isOpen ? 'page' : undefined}
      className={cn(cardVariants({ tone }), className)}
    >
      <span className="text-base font-medium text-balance text-foreground">
        {intl.formatMessage({ id: 'exceptionCard.title' }, { shipmentId, route })}
      </span>
      <span className="text-muted-foreground">{reason}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        <ExceptionStatusBadge status={status} />
        {isNew && (
          <Badge className="h-6 bg-info-subtle px-2 text-caption text-info">
            {intl.formatMessage({ id: 'exceptionCard.new' })}
          </Badge>
        )}
        {isCustomerNotified && (
          <Badge variant="outline" className="h-6 px-2 text-caption text-muted-foreground">
            <Check aria-hidden="true" />
            {intl.formatMessage({ id: 'exceptionCard.customerNotified' })}
          </Badge>
        )}
      </span>
    </Link>
  )
}
