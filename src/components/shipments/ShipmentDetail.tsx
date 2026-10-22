import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { TriangleAlert } from 'lucide-react'
import type { Shipment } from '@/api/types'
import { DocumentCheck } from '@/components/exceptions/DocumentCheck'
import { Journey } from '@/components/journey/Journey'
import { AiBlock } from '@/components/provenance/AiBlock'
import { EtaPair } from '@/components/provenance/EtaPair'
import { FreshnessIndicator } from '@/components/provenance/FreshnessIndicator'
import { formatCarrierChannel, formatEvidenceLabel, formatUtcDay } from '@/components/provenance/formatProvenance'
import { Badge } from '@/components/ui/badge'
import type { ExceptionLayerModel, ShipmentDetailModel } from '@/lib/exceptionDetail'
import type { Freshness } from '@/lib/freshness'
import { cn } from '@/lib/utils'

export type ShipmentDetailProps = {
  /** Raw shipment: the ETA pair and the journey derive their own presentation from it. */
  shipment: Shipment
  /** Header and internal data row values, from `buildShipmentDetail`. */
  detail: ShipmentDetailModel
  /** Carrier display names by id, for the journey connectors. */
  carrierNames: Readonly<Record<string, string>>
  freshness: Freshness
  /** Injected clock for every relative time on the screen. */
  now: Date
  /** Status badge shown next to the title; the parent decides which one fits the shipment. */
  statusBadge: ReactNode
  /** Exception layer (opened badge, AI diagnosis, document check). Omit it for a shipment without one. */
  exception?: ExceptionLayerModel
  /** Slot for the recommended action, filled by the exception flow when it exists. */
  recommendedAction?: ReactNode
  className?: string
}

type ExceptionOpenBadgeProps = {
  /** Instant the exception was opened. */
  openedAt: string
  className?: string
}

function ExceptionOpenBadge({ openedAt, className }: ExceptionOpenBadgeProps) {
  const intl = useIntl()

  return (
    <Badge variant="destructive" className={cn('h-6 w-fit px-2 text-caption', className)}>
      <TriangleAlert aria-hidden="true" />
      {intl.formatMessage({ id: 'shipmentDetail.exceptionOpen' }, { date: formatUtcDay(intl, openedAt) })}
    </Badge>
  )
}

type ShipmentDetailHeaderProps = Pick<ShipmentDetailProps, 'detail' | 'freshness' | 'now' | 'statusBadge'> & {
  exceptionOpenedAt?: string
}

/**
 * Title, status and freshness. In a wide container everything sits on one wrapping row; in a narrow
 * one the title takes its own row and the badges (status and, when open, the exception) follow it,
 * because the data row has no room for the exception badge there.
 */
function ShipmentDetailHeader({ detail, freshness, now, statusBadge, exceptionOpenedAt }: ShipmentDetailHeaderProps) {
  const intl = useIntl()
  const { latestEventSource } = detail

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="
        w-full text-xl font-semibold text-balance
        @xl:w-auto @xl:text-2xl
      "
      >
        {intl.formatMessage({ id: 'shipmentDetail.title' }, { shipmentId: detail.shipmentId, route: detail.routeLabel })}
      </h1>
      {statusBadge}
      {exceptionOpenedAt !== undefined && <ExceptionOpenBadge openedAt={exceptionOpenedAt} className="@xl:hidden" />}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <FreshnessIndicator freshness={freshness} now={now} />
        {latestEventSource !== null && (
          <span>
            {intl.formatMessage(
              { id: 'shipmentDetail.source' },
              { carrier: latestEventSource.carrierName, channel: formatCarrierChannel(intl, latestEventSource.channel) },
            )}
          </span>
        )}
      </p>
    </header>
  )
}

type DataCellProps = {
  label: string
  value: string
}

function DataCell({ label, value }: DataCellProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

type InternalDataRowProps = {
  detail: ShipmentDetailModel
  /** Instant the open exception started, when there is one. */
  exceptionOpenedAt?: string
}

/**
 * Customer, origin site, carrier and PO. Wide containers show a bordered row of labelled cells
 * with the exception badge as the last cell; narrow ones show one compact line of text and the
 * badge moves to the header. The labelled list stays in the accessibility tree in both layouts
 * (visually hidden when narrow), the compact line is purely visual.
 */
function InternalDataRow({ detail, exceptionOpenedAt }: InternalDataRowProps) {
  const intl = useIntl()
  const po = intl.formatMessage({ id: 'shipmentDetail.po' }, { poNumber: detail.poNumber })

  return (
    <section
      aria-label={intl.formatMessage({ id: 'shipmentDetail.dataLabel' })}
      className="
        flex items-start justify-between gap-4
        @xl:rounded-lg @xl:border @xl:bg-card @xl:px-5 @xl:py-4
      "
    >
      <p
        aria-hidden="true"
        className="
          text-sm text-muted-foreground
          @xl:hidden
        "
      >
        {intl.formatMessage(
          { id: 'shipmentDetail.dataCompact' },
          { customer: detail.customerName, site: detail.originSiteName, carriers: detail.carriersLabel, po },
        )}
      </p>
      <dl className="
        sr-only
        @xl:not-sr-only @xl:grid @xl:grid-cols-2 @xl:gap-x-8 @xl:gap-y-3
        @3xl:grid-cols-4
      "
      >
        <DataCell label={intl.formatMessage({ id: 'shipmentDetail.customer' })} value={detail.customerName} />
        <DataCell label={intl.formatMessage({ id: 'shipmentDetail.originSite' })} value={detail.originSiteName} />
        <DataCell label={intl.formatMessage({ id: 'shipmentDetail.carrier' })} value={detail.carriersLabel} />
        <DataCell label={intl.formatMessage({ id: 'shipmentDetail.customerPo' })} value={po} />
      </dl>
      {exceptionOpenedAt !== undefined && (
        <ExceptionOpenBadge
          openedAt={exceptionOpenedAt}
          className="
            hidden shrink-0
            @xl:inline-flex
          "
        />
      )}
    </section>
  )
}

type ExceptionLayerProps = {
  layer: ExceptionLayerModel
  poNumber: string
}

function ExceptionLayer({ layer, poNumber }: ExceptionLayerProps) {
  const intl = useIntl()

  return (
    <>
      <AiBlock
        title={intl.formatMessage({ id: 'shipmentDetail.diagnosisTitle' })}
        evidence={{
          label: formatEvidenceLabel(
            intl,
            { kind: 'events', count: layer.citedEventCount },
            { kind: 'documents', count: layer.receivedDocumentCount },
          ),
        }}
      >
        {layer.diagnosis}
      </AiBlock>
      <DocumentCheck rows={layer.documentRows} poNumber={poNumber} />
    </>
  )
}

/**
 * The one data-driven shipment detail (ADR 0025): header, internal data row, ETA pair and journey
 * for any shipment, plus an optional exception layer. Ops exception detail passes the layer; other
 * screens reuse the same structure without it. The AI evidence is plain text until the source
 * events panel exists, so the journey has no clickable steps either.
 */
export function ShipmentDetail({
  shipment,
  detail,
  carrierNames,
  freshness,
  now,
  statusBadge,
  exception,
  recommendedAction,
  className,
}: ShipmentDetailProps) {
  return (
    <article className={cn('@container flex flex-col gap-6', className)}>
      <ShipmentDetailHeader
        detail={detail}
        freshness={freshness}
        now={now}
        statusBadge={statusBadge}
        exceptionOpenedAt={exception?.openedAt}
      />
      <InternalDataRow detail={detail} exceptionOpenedAt={exception?.openedAt} />
      <EtaPair
        carrierEta={shipment.carrierEta}
        carrierName={detail.etaCarrierName}
        estimatedEta={shipment.estimatedEta}
        now={now}
        variant="reason"
      />
      <Journey carrierNames={carrierNames} now={now} shipment={shipment} />
      {exception !== undefined && <ExceptionLayer layer={exception} poNumber={detail.poNumber} />}
      {recommendedAction}
    </article>
  )
}
