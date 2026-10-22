import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { ExceptionStatusBadge } from '@/components/exceptions/ExceptionStatusBadge'
import { RecommendedAction } from '@/components/exceptions/RecommendedAction'
import { toExceptionStatus } from '@/components/exceptions/toExceptionStatus'
import { DetailBackLink } from '@/components/shipments/DetailBackLink'
import { DetailMessage } from '@/components/shipments/DetailMessage'
import { DetailSkeleton } from '@/components/shipments/DetailSkeleton'
import { ShipmentDetail } from '@/components/shipments/ShipmentDetail'
import { SourceEventsSheet } from '@/components/shipments/SourceEventsSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNow } from '@/hooks/useNow'
import { useShipment } from '@/hooks/useShipment'
import { useSourceEventsSheet } from '@/hooks/useSourceEventsSheet'
import type { ReferenceData, Shipment } from '@/api/types'
import {
  buildExceptionLayer,
  buildShipmentDetail,
  pickMostUrgentException,
} from '@/lib/exceptionDetail'
import { shouldOfferCertificateActions } from '@/lib/customerNotice'
import { getFreshness } from '@/lib/freshness'
import { buildSourceEventRows } from '@/lib/sourceEvents'
import { cn } from '@/lib/utils'

export type ExceptionDetailPanelProps = {
  shipmentId: string
  /** Inbox URL (with its search string). Passed only on narrow layouts, where the detail replaces the list. */
  backHref?: string
  className?: string
}

type DetailFrameProps = {
  /** True on wide layouts, where the detail is a card next to the inbox; narrow layouts show it on the page. */
  isCard: boolean
  children: ReactNode
}

function DetailFrame({ isCard, children }: DetailFrameProps) {
  if (!isCard) {
    return <div className="flex flex-col gap-6">{children}</div>
  }

  return <Card className="gap-6 px-6 [--card-spacing:--spacing(6)]">{children}</Card>
}

type ReadyDetailProps = {
  shipment: Shipment
  referenceData: ReferenceData
  isCard: boolean
  /** Shown when the shipment has no open exception. */
  unavailable: ReactNode
}

function ReadyDetail({ shipment, referenceData, isCard, unavailable }: ReadyDetailProps) {
  const now = useNow()
  const sourceEvents = useSourceEventsSheet()
  const exception = pickMostUrgentException(shipment)

  // A shipment without an open exception has no exception detail; it looks like an unknown id.
  if (exception === null) {
    return unavailable
  }

  const freshness = getFreshness(shipment, now)
  const detail = buildShipmentDetail(shipment, referenceData)
  const exceptionLayer = buildExceptionLayer(shipment, exception)
  const carrierNames = Object.fromEntries(referenceData.carriers.map(carrier => [carrier.id, carrier.name]))

  return (
    <DetailFrame isCard={isCard}>
      <ShipmentDetail
        shipment={shipment}
        detail={detail}
        carrierNames={carrierNames}
        freshness={freshness}
        now={now}
        statusBadge={<ExceptionStatusBadge status={toExceptionStatus(exception.type, freshness)} />}
        exception={exceptionLayer}
        titleRef={sourceEvents.titleRef}
        onOpenSourceEvents={sourceEvents.open}
        recommendedAction={(
          <RecommendedAction
            key={exception.id}
            shipmentId={shipment.id}
            exception={exception}
            customerName={detail.customerName}
            offerCertificateActions={shouldOfferCertificateActions(exceptionLayer.documentRows)}
            now={now}
            onSectionRemoved={() => sourceEvents.titleRef.current?.focus()}
          />
        )}
      />
      <SourceEventsSheet
        isOpen={sourceEvents.isOpen}
        onOpenChange={sourceEvents.onOpenChange}
        shipmentId={shipment.id}
        rows={buildSourceEventRows(shipment.rawEvents, exception.aiDiagnosis.basedOnEventIds)}
        carrierNames={carrierNames}
        highlightedEventIds={sourceEvents.highlightedEventIds}
        isDesktop={isCard}
        onCloseAutoFocus={sourceEvents.onCloseAutoFocus}
      />
    </DetailFrame>
  )
}

/**
 * Detail of one open exception for the ops screen. On wide layouts the detail is one white card
 * beside the inbox; with a back link (narrow layouts) its sections sit directly on the page, as in
 * the mobile design. A missing id, a shipment outside the ops scope and a shipment without an open
 * exception all show the same "isn't available" card, so the screen never reveals which one it was.
 * The back link, when given, is shown in every state so a narrow layout never traps the user.
 */
export function ExceptionDetailPanel({ shipmentId, backHref, className }: ExceptionDetailPanelProps) {
  const intl = useIntl()
  const shipment = useShipment(shipmentId, { role: 'ops' })
  const isCard = backHref === undefined

  const unavailable = <DetailMessage title={intl.formatMessage({ id: 'exceptionDetail.unavailable' })} />

  let body: ReactNode
  switch (shipment.status) {
    case 'loading':
      body = <DetailFrame isCard={isCard}><DetailSkeleton label={intl.formatMessage({ id: 'exceptionDetail.loading' })} /></DetailFrame>
      break
    case 'error':
      body = (
        <DetailMessage
          role="alert"
          title={intl.formatMessage({ id: 'exceptionDetail.error.title' })}
          action={(
            <Button variant="outline" onClick={shipment.retry}>
              {intl.formatMessage({ id: 'exceptionDetail.error.retry' })}
            </Button>
          )}
        />
      )
      break
    case 'notFound':
      body = unavailable
      break
    case 'ready':
      body = (
        <ReadyDetail
          shipment={shipment.shipment}
          referenceData={shipment.referenceData}
          isCard={isCard}
          unavailable={unavailable}
        />
      )
      break
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {backHref !== undefined && (
        <DetailBackLink
          href={backHref}
          label={intl.formatMessage({ id: 'exceptionsDetail.backShort' })}
          accessibleLabel={intl.formatMessage({ id: 'exceptionsDetail.back' })}
        />
      )}
      {body}
    </div>
  )
}
