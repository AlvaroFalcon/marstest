import type { ReactNode } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useParams } from 'react-router'
import { CustomerGate } from '@/components/customer/CustomerGate'
import { CustomerShipmentCard } from '@/components/customer/CustomerShipmentCard'
import { CustomerShipmentsTable } from '@/components/customer/CustomerShipmentsTable'
import { CustomerShipmentsTabs } from '@/components/customer/CustomerShipmentsTabs'
import { ProactiveAlert } from '@/components/customer/ProactiveAlert'
import { ShipmentsFooter } from '@/components/shipments/ShipmentsFooter'
import { ShipmentsListMessage } from '@/components/shipments/ShipmentsListMessage'
import { ShipmentsListSkeleton } from '@/components/shipments/ShipmentsListSkeleton'
import { ShipmentsSearchBox } from '@/components/shipments/ShipmentsSearchBox'
import { useCustomerShipments } from '@/hooks/useCustomerShipments'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useNow } from '@/hooks/useNow'

type PageMainProps = {
  /** Banner shown above the heading, or `false` for none. */
  alert?: ReactNode
  children: ReactNode
}

/** Landmark and heading shared by every state of the page, so the heading never disappears while loading or failing. */
function PageMain({ alert = false, children }: PageMainProps) {
  return (
    <main className="@container flex flex-col gap-4">
      {alert}
      <h1 className="text-2xl font-semibold">
        <FormattedMessage id="customerShipments.title" />
      </h1>
      {children}
    </main>
  )
}

type CustomerShipmentsListProps = {
  customerId: string
}

/** The list proper: alert, tabs, search, rows and pagination of one customer, driven by the URL. */
function CustomerShipmentsList({ customerId }: CustomerShipmentsListProps) {
  const intl = useIntl()
  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const shipments = useCustomerShipments(customerId)

  if (shipments.status === 'loading') {
    return (
      <PageMain>
        <ShipmentsListSkeleton />
      </PageMain>
    )
  }
  if (shipments.status === 'error') {
    return (
      <PageMain>
        <ShipmentsListMessage
          role="alert"
          title={intl.formatMessage({ id: 'customerShipments.error.title' })}
          action={{ label: intl.formatMessage({ id: 'shipmentList.error.retry' }), onClick: shipments.retry }}
        />
      </PageMain>
    )
  }

  const { alert, list, query, tabCounts } = shipments

  // Search comes first on narrow layouts and after the tabs on wide ones; rendering each order
  // (instead of CSS `order`) keeps the keyboard order equal to the visual order.
  const tabs = (
    <CustomerShipmentsTabs
      activeTab={query.tab}
      counts={tabCounts}
      onTabChange={shipments.setTab}
      isDesktop={isDesktop}
      className="max-w-full min-w-0"
    />
  )

  return (
    <PageMain alert={alert !== null && (
      <ProactiveAlert
        alert={alert}
        customerId={customerId}
        isCompact={!isDesktop}
        onShowMore={() => shipments.setTab('needsAttention')}
      />
    )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isDesktop && tabs}
        <ShipmentsSearchBox
          value={query.search}
          onSearch={shipments.setSearch}
          label={intl.formatMessage({ id: 'customerShipments.search.label' })}
          placeholder={intl.formatMessage({
            id: isDesktop ? 'customerShipments.search.placeholder' : 'customerShipments.search.placeholderShort',
          })}
          className="
            w-full
            @3xl:ml-auto @3xl:w-96
          "
        />
        {!isDesktop && tabs}
      </div>
      {list.totalCount === 0
        ? (
            <ShipmentsListMessage
              title={intl.formatMessage({ id: 'customerShipments.empty.title' })}
              action={query.search === ''
                ? null
                : { label: intl.formatMessage({ id: 'customerShipments.empty.clear' }), onClick: () => shipments.setSearch('') }}
            />
          )
        : (
            <>
              {isDesktop
                ? <CustomerShipmentsTable rows={list.rows} now={now} className="rounded-xl border bg-card" />
                : (
                    <ul
                      aria-label={intl.formatMessage({ id: 'shipmentList.cards.label' })}
                      className="flex flex-col gap-2"
                    >
                      {list.rows.map(row => (
                        <li key={row.id} className="flex flex-col">
                          <CustomerShipmentCard row={row} now={now} />
                        </li>
                      ))}
                    </ul>
                  )}
              {list.pageCount > 1
                ? (
                    <ShipmentsFooter
                      shownCount={list.rows.length}
                      totalCount={list.totalCount}
                      page={list.page}
                      pageCount={list.pageCount}
                      onPageChange={shipments.setPage}
                    />
                  )
                : (
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                      {intl.formatMessage(
                        { id: 'shipmentList.showing' },
                        { shown: list.rows.length, total: list.totalCount },
                      )}
                    </p>
                  )}
            </>
          )}
    </PageMain>
  )
}

/**
 * Customer shipments list. A customer only ever sees their own shipments: an unknown customer id
 * renders "Page not found" inside the shell, and a failed reference-data load renders a neutral
 * error. The detail of one shipment lives in `CustomerShipmentPage`.
 */
export function CustomerShipmentsPage() {
  const { customerId } = useParams()

  return (
    <CustomerGate
      customerId={customerId}
      loading={(
        <PageMain>
          <ShipmentsListSkeleton />
        </PageMain>
      )}
      error={(
        <PageMain>
          <p role="alert" className="text-muted-foreground">
            <FormattedMessage id="customerShipments.loadFailed" />
          </p>
        </PageMain>
      )}
    >
      {customer => <CustomerShipmentsList customerId={customer.id} />}
    </CustomerGate>
  )
}
