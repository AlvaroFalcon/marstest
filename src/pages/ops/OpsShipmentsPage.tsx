import { useIntl } from 'react-intl'
import { ShipmentCard } from '@/components/shipments/ShipmentCard'
import { ShipmentsFooter } from '@/components/shipments/ShipmentsFooter'
import { ShipmentsListMessage } from '@/components/shipments/ShipmentsListMessage'
import { ShipmentsListSkeleton } from '@/components/shipments/ShipmentsListSkeleton'
import { ShipmentsTable } from '@/components/shipments/ShipmentsTable'
import { ShipmentsToolbar } from '@/components/shipments/ShipmentsToolbar'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useNow } from '@/hooks/useNow'
import { useShipments } from '@/hooks/useShipments'

/**
 * Viewport at which the shipments show as a table instead of cards. One value drives the layout,
 * the filter presentation (popover vs bottom sheet) and the sort control, so they never disagree.
 * A viewport query is used instead of a container query because it also has to decide the
 * presentation of the filters, which render in a portal outside the page container, and because
 * it renders only one of table and cards.
 */
const DESKTOP_QUERY = '(min-width: 64rem)'

/**
 * Ops "All shipments" list. The table (wide) or cards (narrow) show the shipments of the ops
 * sites, narrowed by the site, status and search filters, ordered by carrier ETA or confidence and
 * paginated; all of that view state lives in the URL. The route also serves
 * `/ops/shipments/:shipmentId`, which keeps showing the list until the shipment detail exists.
 */
export function OpsShipmentsPage() {
  const intl = useIntl()
  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const shipments = useShipments()

  return (
    <main className="@container flex flex-col gap-4">
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
          {shipments.list.totalCount === 0
            ? (
                <ShipmentsListMessage
                  title={intl.formatMessage({ id: 'shipmentList.empty.title' })}
                  action={shipments.hasActiveFilters
                    ? { label: intl.formatMessage({ id: 'shipmentList.empty.clear' }), onClick: shipments.clearFilters }
                    : null}
                />
              )
            : (
                <>
                  {isDesktop
                    ? (
                        <ShipmentsTable
                          rows={shipments.list.rows}
                          now={now}
                          sort={shipments.query.sort}
                          onSortChange={shipments.setSort}
                          className="rounded-xl border bg-card"
                        />
                      )
                    : (
                        <ul
                          aria-label={intl.formatMessage({ id: 'shipmentList.cards.label' })}
                          className="flex flex-col gap-2"
                        >
                          {shipments.list.rows.map(row => (
                            <li key={row.id} className="flex flex-col">
                              <ShipmentCard row={row} now={now} />
                            </li>
                          ))}
                        </ul>
                      )}
                  <ShipmentsFooter
                    shownCount={shipments.list.rows.length}
                    totalCount={shipments.list.totalCount}
                    page={shipments.list.page}
                    pageCount={shipments.list.pageCount}
                    onPageChange={shipments.setPage}
                  />
                </>
              )}
        </>
      )}
    </main>
  )
}
