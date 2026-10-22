import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useIntl } from 'react-intl'
import { ArrowLeft, SearchX } from 'lucide-react'
import { ExceptionStatusBadge, type ExceptionStatus } from '@/components/exceptions/ExceptionStatusBadge'
import { RecommendedAction } from '@/components/exceptions/RecommendedAction'
import { ShipmentDetail } from '@/components/shipments/ShipmentDetail'
import { SourceEventsSheet } from '@/components/shipments/SourceEventsSheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useExceptionsSearchParams } from '@/hooks/useExceptionsSearchParams'
import { useNow } from '@/hooks/useNow'
import { useShipment } from '@/hooks/useShipment'
import type { ExceptionType, ReferenceData, Shipment } from '@/api/types'
import {
  buildExceptionLayer,
  buildShipmentDetail,
  pickMostUrgentException,
} from '@/lib/exceptionDetail'
import { shouldOfferCertificateActions } from '@/lib/customerNotice'
import { getFreshness, type Freshness } from '@/lib/freshness'
import { buildSourceEventRows } from '@/lib/sourceEvents'
import { cn } from '@/lib/utils'

export type ExceptionDetailPanelProps = {
  shipmentId: string
  /** Inbox URL (with its search string). Passed only on narrow layouts, where the detail replaces the list. */
  backHref?: string
  className?: string
}

type BackLinkProps = {
  href: string
}

function BackLink({ href }: BackLinkProps) {
  const intl = useIntl()

  return (
    <Link
      to={href}
      aria-label={intl.formatMessage({ id: 'exceptionsDetail.back' })}
      className="
        inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-hidden
        hover:text-foreground
        focus-visible:ring-3 focus-visible:ring-ring/50
      "
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {intl.formatMessage({ id: 'exceptionsDetail.backShort' })}
    </Link>
  )
}

function toExceptionStatus(type: ExceptionType, freshness: Freshness): ExceptionStatus {
  if (type === 'staleTracking') {
    return { type, staleHours: freshness.kind === 'notApplicable' ? 0 : Math.floor(freshness.hoursSinceUpdate) }
  }
  return { type }
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

type DetailMessageProps = {
  title: string
  role?: 'alert'
  action?: ReactNode
}

/** Dashed message card, the same one the inbox uses for its own empty and error states. */
function DetailMessage({ title, role, action }: DetailMessageProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center"
    >
      <SearchX aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-base font-medium">{title}</p>
      {action}
    </div>
  )
}

/**
 * Placeholder shaped like the detail (header, data row, ETA pair, journey, diagnosis, document
 * rows) so the layout does not jump when the data arrives. It is a container itself so the ETA
 * pair stacks the way the real one does.
 */
function DetailSkeleton() {
  const intl = useIntl()

  return (
    <div role="status" aria-busy="true" className="@container flex flex-col gap-6">
      <span className="sr-only">{intl.formatMessage({ id: 'exceptionDetail.loading' })}</span>
      <Skeleton aria-hidden="true" className="h-8 w-3/4" />
      <Skeleton
        aria-hidden="true"
        className="
          h-10
          @xl:h-16 @xl:rounded-lg
        "
      />
      <div
        aria-hidden="true"
        className="
          grid gap-3
          @xl:grid-cols-2
        "
      >
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton aria-hidden="true" className="h-40 rounded-lg" />
      <Skeleton aria-hidden="true" className="h-32 rounded-lg" />
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  )
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
  const titleRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [highlightedEventIds, setHighlightedEventIds] = useState<readonly string[]>([])
  const { isSourceEventsOpen, openSourceEvents, closeSourceEvents } = useExceptionsSearchParams(null)
  const exception = pickMostUrgentException(shipment)

  // A shipment without an open exception has no exception detail; it looks like an unknown id.
  if (exception === null) {
    return unavailable
  }

  const freshness = getFreshness(shipment, now)
  const detail = buildShipmentDetail(shipment, referenceData)
  const exceptionLayer = buildExceptionLayer(shipment, exception)
  const carrierNames = Object.fromEntries(referenceData.carriers.map(carrier => [carrier.id, carrier.name]))

  function handleOpenSourceEvents(highlightEventIds: readonly string[] = []): void {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setHighlightedEventIds(highlightEventIds)
    openSourceEvents()
  }

  function handleSourceEventsOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      setHighlightedEventIds([])
      closeSourceEvents()
    }
  }

  // The sheet has no SheetTrigger (its state lives in the URL), so Radix has nothing to return
  // focus to. Focus goes back to the control that opened it; when there is none (opened from the
  // URL) or it left the page, it goes to the title instead of being lost on the body.
  function handleCloseAutoFocus(event: Event): void {
    event.preventDefault()
    const opener = openerRef.current
    openerRef.current = null
    if (opener?.isConnected) {
      opener.focus()
    }
    else {
      titleRef.current?.focus()
    }
  }

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
        titleRef={titleRef}
        onOpenSourceEvents={handleOpenSourceEvents}
        recommendedAction={(
          <RecommendedAction
            key={exception.id}
            shipmentId={shipment.id}
            exception={exception}
            customerName={detail.customerName}
            offerCertificateActions={shouldOfferCertificateActions(exceptionLayer.documentRows)}
            now={now}
            onSectionRemoved={() => titleRef.current?.focus()}
          />
        )}
      />
      <SourceEventsSheet
        isOpen={isSourceEventsOpen}
        onOpenChange={handleSourceEventsOpenChange}
        shipmentId={shipment.id}
        rows={buildSourceEventRows(shipment.rawEvents, exception.aiDiagnosis.basedOnEventIds)}
        carrierNames={carrierNames}
        highlightedEventIds={highlightedEventIds}
        isDesktop={isCard}
        onCloseAutoFocus={handleCloseAutoFocus}
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
      body = <DetailFrame isCard={isCard}><DetailSkeleton /></DetailFrame>
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
      {backHref !== undefined && <BackLink href={backHref} />}
      {body}
    </div>
  )
}
