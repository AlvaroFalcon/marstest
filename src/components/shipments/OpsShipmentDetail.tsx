import { useIntl, type IntlShape } from 'react-intl'
import type { ReferenceData, Shipment } from '@/api/types'
import { formatEvidenceLabel } from '@/components/provenance/formatProvenance'
import { ShipmentActions } from '@/components/shipments/ShipmentActions'
import { ShipmentDetail, type ShipmentAiSignal, type ShipmentStateBadge } from '@/components/shipments/ShipmentDetail'
import { ShipmentDetailStatusBadge } from '@/components/shipments/ShipmentDetailStatusBadge'
import { SourceEventsSheet } from '@/components/shipments/SourceEventsSheet'
import { useNow } from '@/hooks/useNow'
import { useSourceEventsSheet } from '@/hooks/useSourceEventsSheet'
import { buildDocumentRows, buildExceptionLayer, buildShipmentDetail } from '@/lib/exceptionDetail'
import { getFreshness } from '@/lib/freshness'
import {
  buildAiSignal,
  buildShipmentActions,
  getShipmentDetailState,
  type AiSignalModel,
  type ShipmentDetailState,
} from '@/lib/shipmentDetailState'
import { buildSourceEventRows } from '@/lib/sourceEvents'
import routes from '@/routes'

export type OpsShipmentDetailProps = {
  shipment: Shipment
  referenceData: ReferenceData
  /** True on wide layouts, where the source events open in a side sheet instead of a bottom sheet. */
  isDesktop: boolean
  className?: string
}

/**
 * The badge on the data row. A shipment with another open exception returns `undefined` so the
 * exception layer's own "Exception open · date" badge shows.
 */
function getStateBadge(intl: IntlShape, state: ShipmentDetailState): ShipmentStateBadge | undefined {
  switch (state.kind) {
    case 'watching':
      return { tone: 'warning', label: intl.formatMessage({ id: 'shipmentState.possibleDelay' }) }
    case 'predictedDelay':
      return state.exception === null
        ? { tone: 'critical', label: intl.formatMessage({ id: 'shipmentState.predictedWithoutException' }) }
        : {
            tone: 'critical',
            label: intl.formatMessage({ id: 'shipmentState.exceptionOpenedAutomatically' }),
            shortLabel: intl.formatMessage({ id: 'shipmentState.exceptionOpened' }),
          }
    case 'exception':
      return undefined
    case 'onTrack':
    case 'stale':
    case 'scheduled':
    case 'delivered':
      return { tone: 'success', label: intl.formatMessage({ id: 'shipmentState.noException' }) }
  }
}

function toAiSignalView(intl: IntlShape, signal: AiSignalModel): ShipmentAiSignal {
  const evidence = signal.evidence
  return {
    title: intl.formatMessage({ id: `aiSignal.title.${signal.kind}` }),
    text: signal.text,
    evidenceLabel: evidence === null
      ? null
      : evidence.kind === 'label'
        ? evidence.label
        : formatEvidenceLabel(intl, { kind: 'events', count: evidence.count }),
  }
}

/**
 * Ops detail of any shipment. The three states of the demo story (on track, watching, predicted
 * delay) and every other case (open exception, stale, scheduled, delivered) are the same screen:
 * the state is derived from the shipment, which decides the badges, the AI signal and the actions.
 * A shipment with an open exception shows the exception layer and links to the inbox, where the
 * customer draft is reviewed and approved; this screen never sends anything itself.
 */
export function OpsShipmentDetail({ shipment, referenceData, isDesktop, className }: OpsShipmentDetailProps) {
  const intl = useIntl()
  const now = useNow()
  const sourceEvents = useSourceEventsSheet()

  const state = getShipmentDetailState(shipment, now)
  const freshness = getFreshness(shipment, now)
  const detail = buildShipmentDetail(shipment, referenceData)
  const carrierNames = Object.fromEntries(referenceData.carriers.map(carrier => [carrier.id, carrier.name]))
  const aiSignal = buildAiSignal(shipment, state)
  const openException = state.kind === 'exception' || state.kind === 'predictedDelay' ? state.exception : null
  const citedEventIds = aiSignal?.citedEventIds ?? openException?.aiDiagnosis.basedOnEventIds ?? []

  return (
    <>
      <ShipmentDetail
        className={className}
        shipment={shipment}
        detail={detail}
        carrierNames={carrierNames}
        freshness={freshness}
        now={now}
        statusBadge={<ShipmentDetailStatusBadge state={state} freshness={freshness} />}
        etaVariant="comparison"
        stateBadge={getStateBadge(intl, state)}
        exception={state.kind === 'exception' ? buildExceptionLayer(shipment, state.exception) : undefined}
        aiSignal={aiSignal === null ? undefined : toAiSignalView(intl, aiSignal)}
        documentRows={buildDocumentRows(shipment, openException?.type)}
        actions={(
          <ShipmentActions
            model={buildShipmentActions(shipment, state)}
            carrierName={detail.etaCarrierName}
            customerName={detail.customerName}
            inboxHref={routes.ops.exception(shipment.id)}
          />
        )}
        titleRef={sourceEvents.titleRef}
        onOpenSourceEvents={sourceEvents.open}
      />
      <SourceEventsSheet
        isOpen={sourceEvents.isOpen}
        onOpenChange={sourceEvents.onOpenChange}
        shipmentId={shipment.id}
        rows={buildSourceEventRows(shipment.rawEvents, citedEventIds)}
        carrierNames={carrierNames}
        highlightedEventIds={sourceEvents.highlightedEventIds}
        isDesktop={isDesktop}
        onCloseAutoFocus={sourceEvents.onCloseAutoFocus}
      />
    </>
  )
}
