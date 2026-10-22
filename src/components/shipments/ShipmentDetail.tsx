import type { ReactNode, Ref } from 'react'
import { useIntl, type IntlShape } from 'react-intl'
import { CircleCheck, Eye, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { Shipment } from '@/api/types'
import { DocumentCheck } from '@/components/exceptions/DocumentCheck'
import { Journey } from '@/components/journey/Journey'
import { AiBlock } from '@/components/provenance/AiBlock'
import { EtaPair, type EtaPairProps } from '@/components/provenance/EtaPair'
import { FreshnessIndicator } from '@/components/provenance/FreshnessIndicator'
import { formatCarrierChannel, formatEvidenceLabel, formatUtcDay } from '@/components/provenance/formatProvenance'
import { Badge } from '@/components/ui/badge'
import type { DocumentRow, ExceptionLayerModel, ShipmentDetailModel } from '@/lib/exceptionDetail'
import type { Freshness } from '@/lib/freshness'
import { cn } from '@/lib/utils'

/** Tone of a {@link ShipmentStateBadge}: the icon and colours that go with the label. */
export type ShipmentStateTone = 'success' | 'warning' | 'critical'

/**
 * The state of the shipment's exceptions as a badge on the data row ("No open exception",
 * "Possible delay · no exception yet", "Exception opened automatically").
 */
export type ShipmentStateBadge = {
  tone: ShipmentStateTone
  label: string
  /** Shorter label for narrow containers, where the badge sits under the title. */
  shortLabel?: string
}

/** AI signal block of a shipment that is being watched or has a predicted delay. */
export type ShipmentAiSignal = {
  /** Already worded, starting with "AI" ("AI signal · possible delay"). */
  title: string
  text: string
  /** What the text is based on; `null` when there is nothing to show. It opens the source events when a handler exists. */
  evidenceLabel: string | null
}

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
  /**
   * What the estimate card says under the range: the one-line "Why" (default, as on the exception
   * detail) or how the estimate compares with the carrier ETA ("In line with the carrier ETA").
   */
  etaVariant?: EtaPairProps['variant']
  /** Replaces the "Exception open" badge of the exception layer, and is the only badge when there is no layer. */
  stateBadge?: ShipmentStateBadge
  /** AI signal block between the ETAs and the journey; replaces the exception layer's diagnosis. */
  aiSignal?: ShipmentAiSignal
  /** Document check rows; defaults to the exception layer's rows. */
  documentRows?: DocumentRow[]
  /** Actions card. When given, it sits beside the document check (below it in narrow containers). */
  actions?: ReactNode
  /** Slot for the recommended action, filled by the exception flow when it exists. */
  recommendedAction?: ReactNode
  /** Ref of the title, so a flow that removes the focused control can move focus back to the top. */
  titleRef?: Ref<HTMLHeadingElement>
  /**
   * Opens the source events panel. Called without ids from the AI evidence button ("Based on N
   * events") and with the raw event ids of a step when a journey step is selected. Omit it and the
   * evidence is plain text and the journey steps are not clickable.
   */
  onOpenSourceEvents?: (highlightEventIds?: readonly string[]) => void
  className?: string
}

const STATE_TONES = {
  success: { icon: CircleCheck, variant: 'secondary', className: 'bg-success-subtle text-success' },
  warning: { icon: Eye, variant: 'secondary', className: 'bg-warning-subtle text-warning' },
  critical: { icon: TriangleAlert, variant: 'destructive', className: '' },
} as const satisfies Record<ShipmentStateTone, { icon: LucideIcon, variant: 'secondary' | 'destructive', className: string }>

type StateBadgeProps = {
  label: string
  tone: ShipmentStateTone
  className?: string
}

function StateBadge({ label, tone, className }: StateBadgeProps) {
  const { icon: Icon, variant, className: toneClassName } = STATE_TONES[tone]

  return (
    <Badge variant={variant} className={cn('h-6 w-fit px-2 text-caption', toneClassName, className)}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  )
}

/** The badge to show: the given one, or "Exception open" when the exception layer is present. */
function resolveStateBadge(
  intl: IntlShape,
  stateBadge: ShipmentStateBadge | undefined,
  exception: ExceptionLayerModel | undefined,
): ShipmentStateBadge | undefined {
  if (stateBadge !== undefined) {
    return stateBadge
  }
  if (exception === undefined) {
    return undefined
  }
  return {
    tone: 'critical',
    label: intl.formatMessage({ id: 'shipmentDetail.exceptionOpen' }, { date: formatUtcDay(intl, exception.openedAt) }),
  }
}

type ShipmentDetailHeaderProps = Pick<ShipmentDetailProps, 'detail' | 'freshness' | 'now' | 'statusBadge' | 'titleRef'> & {
  state?: ShipmentStateBadge
}

/**
 * Title, status and freshness. In a wide container everything sits on one wrapping row; in a narrow
 * one the title takes its own row and the badges (status and the state) follow it,
 * because the data row has no room for the state badge there.
 */
function ShipmentDetailHeader({ detail, freshness, now, statusBadge, titleRef, state }: ShipmentDetailHeaderProps) {
  const intl = useIntl()
  const { latestEventSource } = detail

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1
        ref={titleRef}
        tabIndex={-1}
        className="
          w-full rounded-sm text-xl font-semibold text-balance outline-hidden
          focus-visible:ring-3 focus-visible:ring-ring
          @xl:w-auto @xl:text-2xl
        "
      >
        {intl.formatMessage({ id: 'shipmentDetail.title' }, { shipmentId: detail.shipmentId, route: detail.routeLabel })}
      </h1>
      {statusBadge}
      {state !== undefined && (
        <StateBadge
          label={state.shortLabel ?? state.label}
          tone={state.tone}
          className="@xl:hidden"
        />
      )}
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
  state?: ShipmentStateBadge
}

/**
 * Customer, origin site, carrier and PO. Wide containers show a bordered row of labelled cells
 * with the state badge as the last cell; narrow ones show one compact line of text and the
 * badge moves to the header. The labelled list stays in the accessibility tree in both layouts
 * (visually hidden when narrow), the compact line is purely visual.
 */
function InternalDataRow({ detail, state }: InternalDataRowProps) {
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
      {state !== undefined && (
        <StateBadge
          label={state.label}
          tone={state.tone}
          className="
            hidden shrink-0
            @xl:inline-flex
          "
        />
      )}
    </section>
  )
}

type AiDiagnosisProps = {
  layer: ExceptionLayerModel
  onOpenSourceEvents?: ShipmentDetailProps['onOpenSourceEvents']
}

function AiDiagnosis({ layer, onOpenSourceEvents }: AiDiagnosisProps) {
  const intl = useIntl()

  return (
    <AiBlock
      title={intl.formatMessage({ id: 'shipmentDetail.diagnosisTitle' })}
      evidence={{
        label: formatEvidenceLabel(
          intl,
          { kind: 'events', count: layer.citedEventCount },
          { kind: 'documents', count: layer.receivedDocumentCount },
        ),
        onClick: onOpenSourceEvents && (() => onOpenSourceEvents()),
      }}
    >
      {layer.diagnosis}
    </AiBlock>
  )
}

type AiSignalBlockProps = {
  signal: ShipmentAiSignal
  onOpenSourceEvents?: ShipmentDetailProps['onOpenSourceEvents']
}

function AiSignalBlock({ signal, onOpenSourceEvents }: AiSignalBlockProps) {
  return (
    <AiBlock
      title={signal.title}
      evidence={signal.evidenceLabel === null
        ? undefined
        : { label: signal.evidenceLabel, onClick: onOpenSourceEvents && (() => onOpenSourceEvents()) }}
    >
      {signal.text}
    </AiBlock>
  )
}

type OptionalDocumentCheckProps = {
  rows: DocumentRow[] | undefined
  poNumber: string
}

function OptionalDocumentCheck({ rows, poNumber }: OptionalDocumentCheckProps) {
  if (rows === undefined) {
    return null
  }

  return <DocumentCheck rows={rows} poNumber={poNumber} />
}

type DocumentsAndActionsProps = OptionalDocumentCheckProps & {
  actions: ReactNode | undefined
}

/** The document check alone, or beside the actions card (below it in narrow containers) when there is one. */
function DocumentsAndActions({ rows, poNumber, actions }: DocumentsAndActionsProps) {
  const documentCheck = <OptionalDocumentCheck rows={rows} poNumber={poNumber} />

  if (actions === undefined) {
    return documentCheck
  }

  return (
    <div className="
      flex flex-col gap-6
      @3xl:grid @3xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] @3xl:items-start
    "
    >
      {documentCheck}
      {actions}
    </div>
  )
}

/**
 * The one data-driven shipment detail (ADR 0025): header, internal data row, ETA pair and journey
 * for any shipment, plus optional layers. Ops exception detail passes the exception layer; the ops
 * shipment detail passes a state badge, an AI signal, the document check and an actions card; other
 * screens reuse the same structure without any of them. When `onOpenSourceEvents` is given, the AI evidence
 * and the journey steps open the source events panel; the owner of that panel keeps its state.
 */
export function ShipmentDetail({
  shipment,
  detail,
  carrierNames,
  freshness,
  now,
  statusBadge,
  exception,
  etaVariant = 'reason',
  stateBadge,
  aiSignal,
  documentRows,
  actions,
  recommendedAction,
  titleRef,
  onOpenSourceEvents,
  className,
}: ShipmentDetailProps) {
  const intl = useIntl()
  const state = resolveStateBadge(intl, stateBadge, exception)
  const rows = documentRows ?? exception?.documentRows

  return (
    <article className={cn('@container flex flex-col gap-6', className)}>
      <ShipmentDetailHeader
        detail={detail}
        freshness={freshness}
        now={now}
        statusBadge={statusBadge}
        titleRef={titleRef}
        state={state}
      />
      <InternalDataRow detail={detail} state={state} />
      <EtaPair
        carrierEta={shipment.carrierEta}
        carrierName={detail.etaCarrierName}
        estimatedEta={shipment.estimatedEta}
        now={now}
        variant={etaVariant}
      />
      {aiSignal !== undefined && <AiSignalBlock signal={aiSignal} onOpenSourceEvents={onOpenSourceEvents} />}
      <Journey
        carrierNames={carrierNames}
        now={now}
        shipment={shipment}
        onStepSelect={onOpenSourceEvents && (step => onOpenSourceEvents(step.rawEventIds))}
      />
      {exception !== undefined && aiSignal === undefined && (
        <AiDiagnosis layer={exception} onOpenSourceEvents={onOpenSourceEvents} />
      )}
      <DocumentsAndActions rows={rows} poNumber={detail.poNumber} actions={actions} />
      {recommendedAction}
    </article>
  )
}
