import { useLocation, useParams } from 'react-router'
import { ExceptionInbox, type ExceptionInboxContent } from '@/components/exceptions/ExceptionInbox'
import type { ExceptionInboxItem as ExceptionInboxCard } from '@/components/exceptions/ExceptionInbox'
import type { ExceptionStatus } from '@/components/exceptions/ExceptionStatusBadge'
import { ExceptionDetailEmptyState } from '@/components/exceptions/ExceptionDetailEmptyState'
import { ExceptionDetailPanel } from '@/components/exceptions/ExceptionDetailPanel'
import { useExceptions } from '@/hooks/useExceptions'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import type { ExceptionInboxItem } from '@/lib/exceptionInbox'
import routes from '@/routes'

function toStatus(item: ExceptionInboxItem): ExceptionStatus {
  switch (item.exception.type) {
    case 'staleTracking':
      return { type: 'staleTracking', staleHours: item.hoursSinceUpdate }
    case 'customsHold':
      return { type: 'customsHold' }
    case 'incident':
      return { type: 'incident' }
    case 'vesselRolled':
      return { type: 'vesselRolled' }
    case 'predictedDelay':
      return { type: 'predictedDelay' }
  }
}

/**
 * Ops exceptions inbox. Wide viewports show the inbox next to the detail panel; narrow ones show
 * the inbox, or only the detail when the URL names an exception, with a link back that keeps the
 * `?site=` filter. The route serves both `/ops/exceptions` and `/ops/exceptions/:shipmentId`.
 */
export function OpsExceptionsPage() {
  const { shipmentId } = useParams()
  const { search } = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const exceptions = useExceptions()

  const selectedSiteId = exceptions.status === 'ready' ? exceptions.selectedSiteId : null
  const options = exceptions.status === 'ready'
    ? [
        ...exceptions.inbox.siteCounts,
        ...exceptions.inbox.outOfScopeSites.map(site => ({ site, exceptionCount: 0 })),
      ]
    : []

  let content: ExceptionInboxContent
  switch (exceptions.status) {
    case 'loading':
      content = { status: 'loading' }
      break
    case 'error':
      content = { status: 'error', onRetry: exceptions.retry }
      break
    case 'ready':
      content = {
        status: 'ready',
        items: exceptions.inbox.items.map((item): ExceptionInboxCard => ({
          shipmentId: item.shipmentId,
          route: item.routeLabel,
          reason: item.reason,
          status: toStatus(item),
          href: `${routes.ops.exception(item.shipmentId)}${search}`,
          isOpen: item.shipmentId === shipmentId,
          isCustomerNotified: item.isCustomerNotified,
        })),
        kpis: {
          needAttention: exceptions.inbox.kpis.needAttention,
          staleOverDay: exceptions.inbox.kpis.staleOver24h,
          onTime: exceptions.inbox.kpis.onTime,
          total: exceptions.inbox.kpis.total,
        },
      }
      break
  }

  const inbox = (
    <ExceptionInbox
      content={content}
      siteFilter={{
        options,
        selectedSiteId,
        totalExceptionCount: exceptions.status === 'ready' ? exceptions.inbox.totalExceptionCount : 0,
        onSelect: exceptions.status === 'ready' ? exceptions.setSelectedSiteId : () => {},
        isDesktop,
      }}
    />
  )

  if (isDesktop) {
    return (
      <main className="grid grid-cols-[33.5rem_1fr] items-start gap-6">
        {inbox}
        {shipmentId === undefined ? <ExceptionDetailEmptyState /> : <ExceptionDetailPanel shipmentId={shipmentId} />}
      </main>
    )
  }

  if (shipmentId !== undefined) {
    return (
      <main>
        <ExceptionDetailPanel shipmentId={shipmentId} backHref={`${routes.ops.exceptions()}${search}`} />
      </main>
    )
  }

  return <main>{inbox}</main>
}
