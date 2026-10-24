import type { ReactNode } from 'react'
import { useLocation, useParams } from 'react-router'
import { useIntl } from 'react-intl'
import { DocumentTitle } from '@/components/layout/DocumentTitle'
import { DetailBackLink } from '@/components/shipments/DetailBackLink'
import { DetailMessage } from '@/components/shipments/DetailMessage'
import { DetailSkeleton } from '@/components/shipments/DetailSkeleton'
import { OpsShipmentDetail } from '@/components/shipments/OpsShipmentDetail'
import { Button } from '@/components/ui/button'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useShipment } from '@/hooks/useShipment'
import routes from '@/routes'

/**
 * Back target of the detail: the list with the search string it was left with, minus the
 * source-events sheet, which belongs to the detail and must not reopen from the list.
 */
function getListHref(search: string): string {
  const searchParams = new URLSearchParams(search)
  searchParams.delete('events')
  const listSearch = searchParams.toString()
  return `${routes.ops.shipments()}${listSearch === '' ? '' : `?${listSearch}`}`
}

/**
 * Ops detail of one shipment, whatever its state (`/ops/shipments/:shipmentId`). It shows alone,
 * under a back link that returns to the list with its filters, sort and page. A missing id and a
 * shipment outside the ops scope show the same "isn't available" card, so the screen never reveals
 * which one it was.
 */
export function OpsShipmentPage() {
  const intl = useIntl()
  const { shipmentId = '' } = useParams()
  const { search } = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const shipment = useShipment(shipmentId, { role: 'ops' })

  let body: ReactNode
  switch (shipment.status) {
    case 'loading':
      body = <DetailSkeleton label={intl.formatMessage({ id: 'opsShipment.loading' })} />
      break
    case 'error':
      body = (
        <DetailMessage
          role="alert"
          title={intl.formatMessage({ id: 'opsShipment.error.title' })}
          action={(
            <Button variant="outline" onClick={shipment.retry}>
              {intl.formatMessage({ id: 'opsShipment.error.retry' })}
            </Button>
          )}
        />
      )
      break
    case 'notFound':
      body = <DetailMessage title={intl.formatMessage({ id: 'opsShipment.unavailable' })} />
      break
    case 'ready':
      body = <OpsShipmentDetail shipment={shipment.shipment} referenceData={shipment.referenceData} isDesktop={isDesktop} />
      break
  }

  return (
    <main className="flex flex-col gap-4">
      <DocumentTitle page={shipmentId} />
      <DetailBackLink
        href={getListHref(search)}
        label={intl.formatMessage({ id: 'opsShipment.back' })}
        accessibleLabel={intl.formatMessage({ id: 'opsShipment.backAccessible' })}
      />
      {body}
    </main>
  )
}
