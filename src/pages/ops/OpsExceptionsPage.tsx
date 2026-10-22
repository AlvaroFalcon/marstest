import { useEffect } from 'react'
import { useIntl } from 'react-intl'
import { useLocation, useParams } from 'react-router'
import { ExceptionInbox, type ExceptionInboxContent } from '@/components/exceptions/ExceptionInbox'
import type { ExceptionInboxItem as ExceptionInboxCard } from '@/components/exceptions/ExceptionInbox'
import type { ExceptionStatus } from '@/components/exceptions/ExceptionStatusBadge'
import { ExceptionDetailEmptyState } from '@/components/exceptions/ExceptionDetailEmptyState'
import { ExceptionDetailPanel } from '@/components/exceptions/ExceptionDetailPanel'
import { ScrollColumn } from '@/components/layout/ScrollColumn'
import { useExceptions } from '@/hooks/useExceptions'
import { useMarkExceptionSeen, useUnseenExceptionShipmentIds } from '@/hooks/useUnseenExceptions'
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
  const intl = useIntl()
  const { shipmentId } = useParams()
  const { search } = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const exceptions = useExceptions()
  const unseenShipmentIds = useUnseenExceptionShipmentIds()
  const { mutate: markExceptionSeen } = useMarkExceptionSeen()

  const isOpenExceptionUnseen = shipmentId !== undefined && unseenShipmentIds.includes(shipmentId)
  useEffect(() => {
    // Opening the exception is what "sees" it; the fake API call clears the card's marker.
    if (isOpenExceptionUnseen) {
      markExceptionSeen(shipmentId)
    }
  }, [isOpenExceptionUnseen, shipmentId, markExceptionSeen])

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
          isNew: unseenShipmentIds.includes(item.shipmentId),
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
    // Each column scrolls on its own, so reading a long detail never moves the inbox. The negative
    // margin cancels the columns' 0.25rem focus-ring padding so the content keeps its alignment.
    return (
      <main className="grid grid-cols-[33.5rem_1fr] items-start gap-6">
        <ScrollColumn label={intl.formatMessage({ id: 'exceptionsLayout.inboxColumn' })} className="-m-1">
          {inbox}
        </ScrollColumn>
        {/* Keyed by exception so opening another one starts its detail at the top. */}
        <ScrollColumn
          key={shipmentId ?? 'none'}
          label={intl.formatMessage({ id: 'exceptionsLayout.detailColumn' })}
          className="-m-1"
        >
          {shipmentId === undefined ? <ExceptionDetailEmptyState /> : <ExceptionDetailPanel shipmentId={shipmentId} />}
        </ScrollColumn>
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
