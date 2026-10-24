import { useIntl } from 'react-intl'
import { DocumentTitle } from '@/components/layout/DocumentTitle'
import { ShipmentCard } from '@/components/shipments/ShipmentCard'
import { ShipmentsFooter } from '@/components/shipments/ShipmentsFooter'
import { ShipmentsListMessage } from '@/components/shipments/ShipmentsListMessage'
import { ShipmentsListSkeleton } from '@/components/shipments/ShipmentsListSkeleton'
import { ShipmentsTable } from '@/components/shipments/ShipmentsTable'
import { ShipmentsToolbar } from '@/components/shipments/ShipmentsToolbar'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useNow } from '@/hooks/useNow'
import { useShipments, type UseShipmentsResult } from '@/hooks/useShipments'
import type { ShipmentListRow } from '@/lib/shipmentList'

type ReadyShipments = Extract<UseShipmentsResult, { status: 'ready' }>

type ShipmentRowsProps = {
  rows: ShipmentListRow[]
  now: Date
  isDesktop: boolean
  sort: ReadyShipments['query']['sort']
  onSortChange: ReadyShipments['setSort']
}

/** The rows as a sortable table on wide layouts and as a list of cards on narrow ones. */
function ShipmentRows({ rows, now, isDesktop, sort, onSortChange }: ShipmentRowsProps) {
  const intl = useIntl()

  if (isDesktop) {
    return (
      <ShipmentsTable
        rows={rows}
        now={now}
        sort={sort}
        onSortChange={onSortChange}
        className="rounded-xl border bg-card"
      />
    )
  }

  return (
    <ul
      aria-label={intl.formatMessage({ id: 'shipmentList.cards.label' })}
      className="flex flex-col gap-2"
    >
      {rows.map(row => (
        <li key={row.id} className="flex flex-col">
          <ShipmentCard row={row} now={now} />
        </li>
      ))}
    </ul>
  )
}

type ShipmentResultsProps = {
  shipments: ReadyShipments
  now: Date
  isDesktop: boolean
}

/** The empty state when nothing matches; otherwise the rows and the pagination footer. */
function ShipmentResults({ shipments, now, isDesktop }: ShipmentResultsProps) {
  const intl = useIntl()

  if (shipments.list.totalCount === 0) {
    return (
      <ShipmentsListMessage
        title={intl.formatMessage({ id: 'shipmentList.empty.title' })}
        action={shipments.hasActiveFilters
          ? { label: intl.formatMessage({ id: 'shipmentList.empty.clear' }), onClick: shipments.clearFilters }
          : null}
      />
    )
  }

  return (
    <>
      <ShipmentRows
        rows={shipments.list.rows}
        now={now}
        isDesktop={isDesktop}
        sort={shipments.query.sort}
        onSortChange={shipments.setSort}
      />
      <ShipmentsFooter
        shownCount={shipments.list.rows.length}
        totalCount={shipments.list.totalCount}
        page={shipments.list.page}
        pageCount={shipments.list.pageCount}
        onPageChange={shipments.setPage}
      />
    </>
  )
}

/**
 * Ops "All shipments" list. The table (wide) or cards (narrow) show the shipments of the ops
 * sites, narrowed by the site, status and search filters, ordered by carrier ETA or confidence and
 * paginated; all of that view state lives in the URL. Every row links to the shipment detail
 * (`OpsShipmentPage`), which hands the same search string back to return to this view.
 */
export function OpsShipmentsPage() {
  const intl = useIntl()
  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const shipments = useShipments()

  return (
    <main className="@container flex flex-col gap-4">
      <DocumentTitle page={intl.formatMessage({ id: 'opsShipments.title' })} />
      <h1 className="text-2xl font-semibold">{intl.formatMessage({ id: 'opsShipments.title' })}</h1>
      {shipments.status === 'loading' && <ShipmentsListSkeleton />}
      {shipments.status === 'error' && (
        <ShipmentsListMessage
          role="alert"
          title={intl.formatMessage({ id: 'shipmentList.error.title' })}
          action={{ label: intl.formatMessage({ id: 'shipmentList.error.retry' }), onClick: shipments.retry }}
        />
      )}
      {shipments.status === 'ready' && (
        <>
          <ShipmentsToolbar
            query={shipments.query}
            siteOptions={shipments.siteOptions}
            totalShipmentCount={shipments.totalShipmentCount}
            onSiteChange={shipments.setSiteId}
            onStatusChange={shipments.setStatus}
            onSearch={shipments.setSearch}
            onSortChange={shipments.setSort}
            isDesktop={isDesktop}
          />
          <ShipmentResults shipments={shipments} now={now} isDesktop={isDesktop} />
        </>
      )}
    </main>
  )
}
