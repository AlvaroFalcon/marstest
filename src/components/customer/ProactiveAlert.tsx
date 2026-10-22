import { Link } from 'react-router'
import { useIntl } from 'react-intl'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProactiveAlertData } from '@/lib/customerShipments'
import routes from '@/routes'
import { cn } from '@/lib/utils'
import { formatProactiveAlertMessage } from './customerRowPresentation'

export type ProactiveAlertProps = {
  alert: ProactiveAlertData
  customerId: string
  /** True on narrow layouts: shorter sentence and a short link label. */
  isCompact: boolean
  /** Called by the "+N more" button; the page selects the "Needs attention" tab. */
  onShowMore: () => void
  className?: string
}

/**
 * Warning banner above the customer list about the most urgent shipment, with a link to it and,
 * when other shipments alert too, a "+N more" button. The warning icon and the text carry the
 * meaning, not only the colour.
 */
export function ProactiveAlert({ alert, customerId, isCompact, onShowMore, className }: ProactiveAlertProps) {
  const intl = useIntl()

  return (
    <section
      aria-label={intl.formatMessage({ id: 'proactiveAlert.label' })}
      className={cn(`
        flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-warning bg-warning-subtle px-4 py-3 text-sm
        text-foreground
      `, className)}
    >
      <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-warning" />
      <p className="min-w-0 flex-1">{formatProactiveAlertMessage(intl, alert, isCompact)}</p>
      <Link
        to={routes.customer.shipment(customerId, alert.row.id)}
        aria-label={intl.formatMessage({ id: 'proactiveAlert.viewLabel' }, { shipmentId: alert.row.id })}
        className="
          inline-flex items-center gap-1 rounded-sm font-semibold underline outline-hidden
          focus-visible:ring-3 focus-visible:ring-ring
        "
      >
        {intl.formatMessage({ id: isCompact ? 'proactiveAlert.viewCompact' : 'proactiveAlert.view' })}
        {!isCompact && <ArrowRight aria-hidden="true" className="size-4" />}
      </Link>
      {alert.additionalCount > 0 && (
        <Button
          variant="link"
          size="sm"
          aria-label={intl.formatMessage({ id: 'proactiveAlert.moreLabel' }, { count: alert.additionalCount })}
          onClick={onShowMore}
        >
          {intl.formatMessage({ id: 'proactiveAlert.more' }, { count: alert.additionalCount })}
        </Button>
      )}
    </section>
  )
}
