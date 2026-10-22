import type { Shipment, ShipmentException } from '@/api/types'
import { hasPendingDraft } from '@/lib/customerNotice'
import { classifyDelay } from '@/lib/delayClassification'
import { pickMostUrgentException } from '@/lib/exceptionDetail'
import { getFreshness } from '@/lib/freshness'
import { getShipmentStatus, isDelivered } from '@/lib/shipmentStatus'
import { CONFIDENCE_THRESHOLD } from '@/lib/thresholds'

/**
 * The one state an ops shipment detail is in. The screen never branches on raw fields: every
 * state of the demo story (on track, watching, predicted delay) and every other shipment
 * (open exception, stale, scheduled, delivered) is read from the shipment through this type, so
 * there are no separate screens per state.
 *
 * - `predictedDelay`: our estimate deviates with confidence at or above the threshold.
 *   `exception` is the exception opened for it, or `null` when none exists in the data.
 * - `exception`: any other open exception, which takes priority over the delay class.
 */
export type ShipmentDetailState
  = | { kind: 'onTrack' }
    | { kind: 'watching' }
    | { kind: 'predictedDelay', exception: ShipmentException | null }
    | { kind: 'exception', exception: ShipmentException }
    | { kind: 'stale' }
    | { kind: 'scheduled' }
    | { kind: 'delivered' }

/**
 * Derives the {@link ShipmentDetailState}. Precedence, highest first: delivered; an open exception
 * (a `predictedDelay` one is the predicted-delay state itself); a predicted delay without an
 * exception; no tracking update for more than 24 h; not picked up yet; watching; otherwise on
 * track. Stale and scheduled rank above watching because "no news" and "not started" explain a
 * wide estimate better than a delay signal does.
 *
 * @param now - Injected for deterministic tests; decides staleness.
 */
export function getShipmentDetailState(shipment: Shipment, now: Date): ShipmentDetailState {
  if (isDelivered(shipment)) {
    return { kind: 'delivered' }
  }

  const exception = pickMostUrgentException(shipment)
  if (exception !== null) {
    return exception.type === 'predictedDelay' ? { kind: 'predictedDelay', exception } : { kind: 'exception', exception }
  }

  const delayClass = classifyDelay(shipment)
  if (delayClass === 'predictedDelay') {
    return { kind: 'predictedDelay', exception: null }
  }
  if (getFreshness(shipment, now).kind === 'stale') {
    return { kind: 'stale' }
  }
  const latest = getShipmentStatus(shipment)
  if (latest.kind === 'unknown' || latest.status === 'booked') {
    return { kind: 'scheduled' }
  }
  return delayClass === 'watching' ? { kind: 'watching' } : { kind: 'onTrack' }
}

/** Kind of AI signal block: how sure the AI is that the delivery will be late. */
export type AiSignalKind = 'possibleDelay' | 'delayVeryLikely'

/** What the AI signal block of a watching or predicted shipment shows. */
export type AiSignalModel = {
  kind: AiSignalKind
  text: string
  /** Where the statement comes from; `null` when there is nothing to open. */
  evidence: { kind: 'label', label: string } | { kind: 'events', count: number } | null
  /** Raw events the signal cites, to mark them in the source events panel. */
  citedEventIds: string[]
}

/**
 * Builds the AI signal of a watching or predicted-delay shipment, or `null` for any other state.
 * The seeded `aiSignal` is used as written; without it the text falls back to values already in
 * the data (the open exception's diagnosis, else the "why" of the estimate) and the evidence to
 * the number of raw events, so the block never invents a figure.
 */
export function buildAiSignal(shipment: Shipment, state: ShipmentDetailState): AiSignalModel | null {
  if (state.kind !== 'watching' && state.kind !== 'predictedDelay') {
    return null
  }
  const kind: AiSignalKind = state.kind === 'watching' ? 'possibleDelay' : 'delayVeryLikely'

  if (shipment.aiSignal !== undefined) {
    return {
      kind,
      text: shipment.aiSignal.text,
      evidence: { kind: 'label', label: shipment.aiSignal.evidenceLabel },
      citedEventIds: shipment.aiSignal.basedOnEventIds,
    }
  }

  const diagnosis = state.kind === 'predictedDelay' ? state.exception?.aiDiagnosis : undefined
  const citedEventIds = diagnosis?.basedOnEventIds ?? []
  const eventCount = diagnosis === undefined ? shipment.rawEvents.length : citedEventIds.length

  return {
    kind,
    text: diagnosis?.summary ?? shipment.estimatedEta.reason,
    evidence: eventCount === 0 ? null : { kind: 'events', count: eventCount },
    citedEventIds,
  }
}

/** An action offered on the shipment detail. */
export type ShipmentActionId
  = | 'contactCarrier'
    | 'messageCustomer'
    | 'copyTrackingLink'
    | 'askCarrierToConfirm'
    | 'askNewSlot'
    | 'reviewDraft'
    | 'openInbox'

/** The sentence above the actions; the component words it. */
export type ShipmentActionsNote
  = | 'nothingNeeded'
    | 'watchingLowConfidence'
    | 'watchingNoCarrierEta'
    | 'exceptionWithDraft'
    | 'exceptionOpened'
    | 'predictedWithoutException'
    | 'exceptionOpen'
    | 'stale'
    | 'delivered'

/** What the Actions card shows: a note and the actions in display order. */
export type ShipmentActionsModel = {
  note: ShipmentActionsNote
  actions: ShipmentActionId[]
}

/**
 * Chooses the note and the actions of the Actions card from the state. "Message customer" and
 * "Copy customer tracking link" are always manual; the AI only suggests ("Ask carrier to confirm")
 * while watching, and customer-facing review of a draft appears only when an exception holds a
 * pending draft. Links to the exceptions inbox appear only when an exception exists to open.
 */
export function buildShipmentActions(shipment: Shipment, state: ShipmentDetailState): ShipmentActionsModel {
  switch (state.kind) {
    case 'onTrack':
    case 'scheduled':
      return { note: 'nothingNeeded', actions: ['contactCarrier', 'messageCustomer', 'copyTrackingLink'] }
    case 'watching':
      return {
        note: shipment.estimatedEta.confidence < CONFIDENCE_THRESHOLD ? 'watchingLowConfidence' : 'watchingNoCarrierEta',
        actions: ['askCarrierToConfirm', 'messageCustomer', 'copyTrackingLink'],
      }
    case 'predictedDelay': {
      if (state.exception === null) {
        return { note: 'predictedWithoutException', actions: ['askNewSlot', 'messageCustomer', 'copyTrackingLink'] }
      }
      return hasPendingDraft(state.exception)
        ? { note: 'exceptionWithDraft', actions: ['reviewDraft', 'askNewSlot', 'openInbox'] }
        : { note: 'exceptionOpened', actions: ['askNewSlot', 'messageCustomer', 'openInbox'] }
    }
    case 'exception':
      return {
        note: 'exceptionOpen',
        actions: hasPendingDraft(state.exception)
          ? ['reviewDraft', 'contactCarrier', 'openInbox']
          : ['contactCarrier', 'messageCustomer', 'openInbox'],
      }
    case 'stale':
      return { note: 'stale', actions: ['contactCarrier', 'messageCustomer', 'copyTrackingLink'] }
    case 'delivered':
      return { note: 'delivered', actions: ['messageCustomer', 'copyTrackingLink'] }
  }
}
