import { useIntl } from 'react-intl'
import { SearchX } from 'lucide-react'
import { ExceptionCard, type ExceptionCardProps } from '@/components/exceptions/ExceptionCard'
import { ExceptionKpis, ExceptionKpisSkeleton, type ExceptionKpisProps } from '@/components/exceptions/ExceptionKpis'
import { CompactText } from '@/components/layout/CompactText'
import { SiteFilter, type SiteFilterProps } from '@/components/shipments/SiteFilter'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** One row of the inbox: the props of its card, identified by shipment id. */
export type ExceptionInboxItem = Omit<ExceptionCardProps, 'className'>

/** What the inbox shows. `ready` with no items is the empty state. */
export type ExceptionInboxContent
  = | { status: 'loading' }
    | { status: 'error', onRetry: () => void }
    | { status: 'ready', items: ExceptionInboxItem[], kpis: Omit<ExceptionKpisProps, 'className'> }

export type ExceptionInboxProps = {
  content: ExceptionInboxContent
  /** Site filter props. The filter is hidden while there are no sites to choose from. */
  siteFilter: Omit<SiteFilterProps, 'className'>
  className?: string
}

type InboxMessageProps = {
  title: string
  action: { label: string, onClick: () => void } | null
  role?: 'alert'
}

function InboxMessage({ title, action, role }: InboxMessageProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center"
    >
      <SearchX aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-base font-medium">{title}</p>
      {action !== null && (
        <Button variant="outline" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}

function InboxBody({ content, siteFilter }: Pick<ExceptionInboxProps, 'content' | 'siteFilter'>) {
  const intl = useIntl()

  if (content.status === 'loading') {
    return (
      <div role="status" className="flex flex-col gap-2">
        <span className="sr-only">{intl.formatMessage({ id: 'exceptionInbox.loading' })}</span>
        <Skeleton aria-hidden="true" className="h-28 rounded-xl" />
        <Skeleton aria-hidden="true" className="h-28 rounded-xl" />
        <Skeleton aria-hidden="true" className="h-28 rounded-xl" />
      </div>
    )
  }

  if (content.status === 'error') {
    return (
      <InboxMessage
        role="alert"
        title={intl.formatMessage({ id: 'exceptionInbox.error.title' })}
        action={{ label: intl.formatMessage({ id: 'exceptionInbox.error.retry' }), onClick: content.onRetry }}
      />
    )
  }

  if (content.items.length === 0) {
    return siteFilter.selectedSiteId === null
      ? (
          <InboxMessage title={intl.formatMessage({ id: 'exceptionInbox.empty.title' })} action={null} />
        )
      : (
          <InboxMessage
            title={intl.formatMessage({ id: 'exceptionInbox.empty.siteTitle' })}
            action={{
              label: intl.formatMessage({ id: 'exceptionInbox.empty.showAllSites' }),
              onClick: () => siteFilter.onSelect(null),
            }}
          />
        )
  }

  return (
    <ul aria-label={intl.formatMessage({ id: 'exceptionInbox.listLabel' })} className="flex flex-col gap-2">
      {content.items.map(item => (
        <li key={item.shipmentId} className="flex flex-col">
          <ExceptionCard {...item} />
        </li>
      ))}
    </ul>
  )
}

/**
 * The left column of the ops exceptions screen: KPIs, the heading with the site filter and the
 * urgency-ordered list of exception cards, with loading, error (retry) and empty states (empty
 * offers a way back to all sites when a site filter caused it). It is an `@container`, so the
 * compact copy ("Exceptions", "My sites (3)", "136/142") follows the column width, not the
 * viewport; the page only decides the popover or sheet variant of the filter.
 */
export function ExceptionInbox({ content, siteFilter, className }: ExceptionInboxProps) {
  const intl = useIntl()

  return (
    <section aria-labelledby="exception-inbox-heading" className={cn('@container flex flex-col gap-6', className)}>
      {content.status === 'ready' ? <ExceptionKpis {...content.kpis} /> : <ExceptionKpisSkeleton />}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="exception-inbox-heading" className="text-lg font-semibold">
            <CompactText compact={intl.formatMessage({ id: 'exceptionInbox.headingShort' })} full={intl.formatMessage({ id: 'exceptionInbox.heading' })} />
          </h2>
          {siteFilter.options.length > 0 && <SiteFilter {...siteFilter} />}
        </div>
        <InboxBody content={content} siteFilter={siteFilter} />
      </div>
    </section>
  )
}
