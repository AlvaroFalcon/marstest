import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { useLocation, useParams } from 'react-router'
import { CustomerGate } from '@/components/customer/CustomerGate'
import { CustomerShipmentDetail } from '@/components/customer/CustomerShipmentDetail'
import { DetailBackLink } from '@/components/shipments/DetailBackLink'
import { DetailMessage } from '@/components/shipments/DetailMessage'
import { DetailSkeleton } from '@/components/shipments/DetailSkeleton'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { useShipment } from '@/hooks/useShipment'
import { buildCustomerShipmentDetail } from '@/lib/customerShipmentDetail'
import { NotFoundPage } from '@/pages/NotFoundPage'
import routes from '@/routes'

type DetailLayoutProps = {
  customerId: string
  /** Search string of the list the customer came from (leading `?`), handed back by the back link. */
  listSearch: string
  children: ReactNode
}

/** Landmark and back link shared by every state of the detail, so the way back never disappears. */
function DetailLayout({ customerId, listSearch, children }: DetailLayoutProps) {
  const intl = useIntl()

  return (
    <main className="@container flex flex-col gap-4">
      <DetailBackLink
        href={`${routes.customer.shipments(customerId)}${listSearch}`}
        label={intl.formatMessage({ id: 'customerShipment.back' })}
        accessibleLabel={intl.formatMessage({ id: 'customerShipment.backAccessible' })}
      />
      {children}
    </main>
  )
}

type OwnShipmentProps = {
  customerId: string
  shipmentId: string
  listSearch: string
}

/**
 * Loads the shipment as its customer. A shipment that is unknown or belongs to another customer
 * reads "Page not found" (the two are indistinguishable on purpose).
 */
function OwnShipment({ customerId, shipmentId, listSearch }: OwnShipmentProps) {
  const intl = useIntl()
  const now = useNow()
  const shipment = useShipment(shipmentId, { role: 'customer', customerId })

  switch (shipment.status) {
    case 'notFound':
      return <NotFoundPage />
    case 'loading':
      return (
        <DetailLayout customerId={customerId} listSearch={listSearch}>
          <DetailSkeleton label={intl.formatMessage({ id: 'customerShipment.loading' })} />
        </DetailLayout>
      )
    case 'error':
      return (
        <DetailLayout customerId={customerId} listSearch={listSearch}>
          <DetailMessage
            role="alert"
            title={intl.formatMessage({ id: 'customerShipment.error.title' })}
            action={(
              <Button variant="outline" onClick={shipment.retry}>
                {intl.formatMessage({ id: 'customerShipment.error.retry' })}
              </Button>
            )}
          />
        </DetailLayout>
      )
    case 'ready':
      return (
        <DetailLayout customerId={customerId} listSearch={listSearch}>
          <CustomerShipmentDetail
            shipment={shipment.shipment}
            detail={buildCustomerShipmentDetail(shipment.shipment, shipment.referenceData, now)}
            now={now}
          />
        </DetailLayout>
      )
  }
}

/**
 * Customer detail of one shipment (`/customers/:customerId/shipments/:shipmentId`). The back link
 * returns to the list with the tab, search and page it was left with. An unknown customer, an
 * unknown shipment and another customer's shipment all read "Page not found".
 */
export function CustomerShipmentPage() {
  const intl = useIntl()
  const { customerId, shipmentId = '' } = useParams()
  const { search } = useLocation()

  return (
    <CustomerGate
      customerId={customerId}
      loading={(
        <DetailLayout customerId={customerId ?? ''} listSearch={search}>
          <DetailSkeleton label={intl.formatMessage({ id: 'customerShipment.loading' })} />
        </DetailLayout>
      )}
      error={(
        <DetailLayout customerId={customerId ?? ''} listSearch={search}>
          <p role="alert" className="text-muted-foreground">
            {intl.formatMessage({ id: 'customerShipments.loadFailed' })}
          </p>
        </DetailLayout>
      )}
    >
      {customer => <OwnShipment customerId={customer.id} shipmentId={shipmentId} listSearch={search} />}
    </CustomerGate>
  )
}
