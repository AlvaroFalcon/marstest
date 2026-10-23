import { delay } from 'es-toolkit'
import { createMockDb } from '@/api/mockDb'
import type { MockDb } from '@/api/mockDb'
import { createScriptedEvents, DEMO_NOW_ISO, getEventScript } from '@/api/seed'
import type { ScriptedCarrierEvent } from '@/api/seed'
import { getViewerKey } from '@/lib/notifications'
import type { CarrierNotification, DemoState, ReferenceData, Shipment, ShipmentException, Viewer } from '@/api/types'

/** Simulated network latency, so loading states are visible in the demo (ADR 0033). */
export const DEFAULT_LATENCY_MS = 200

/** Thrown when a shipment or exception id does not exist. Screens show it as "not found". */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

/** Thrown when an action does not apply to the current state, e.g. approving a sent draft. */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

/** Options of {@link createShipmentsApi}. */
export type ShipmentsApiOptions = {
  db: MockDb
  /** Delay before every call resolves. Tests pass `0`. */
  latencyMs?: number
  /**
   * Clock used for `notifiedAt`, `discardedAt` and the simulated event. Defaults to the fixed demo
   * time so new data stays consistent with the seed, whose dates are relative to `DEMO_NOW_ISO`.
   */
  now?: () => Date
}

/**
 * Outcome of {@link ShipmentsApi.simulateCarrierEvent}: the event that was applied, or
 * `scriptFinished` when the viewer's script has no event left and nothing changed.
 */
export type SimulateCarrierEventResult
  = | {
    kind: 'applied'
    shipment: Shipment
    /** Id of the notification the event created, so the toast "View" can mark it read. */
    notificationId: string
    /** Toast text of the event. */
    headline: string
    /** True when the event opened an exception, so ops can jump to it. */
    opensException: boolean
  }
  | { kind: 'scriptFinished' }

/**
 * The fake shipments API the TanStack Query hooks call. Every function is async, waits for the
 * simulated latency and returns copies of the stored data, so it behaves like a real HTTP client
 * and can be replaced by one without touching the screens.
 */
export type ShipmentsApi = {
  /** Customers, sites and carriers, to resolve ids into names. */
  getReferenceData: () => Promise<ReferenceData>
  /** Every shipment, unfiltered: scoping to an ops user or customer is done in `src/lib/`. */
  listShipments: () => Promise<Shipment[]>
  /** Shipments that have at least one open exception, unfiltered and unordered. */
  listExceptions: () => Promise<Shipment[]>
  /** One shipment. Rejects with {@link NotFoundError} when it does not exist. */
  getShipment: (shipmentId: string) => Promise<Shipment>
  /**
   * Marks a pending customer notice as sent with the (possibly edited) `body`. Rejects with
   * {@link ConflictError} when the draft is not pending.
   */
  approveDraft: (shipmentId: string, exceptionId: string, body: string) => Promise<Shipment>
  /** Discards a pending customer notice. Rejects with {@link ConflictError} when it is not pending. */
  discardDraft: (shipmentId: string, exceptionId: string) => Promise<Shipment>
  /**
   * Applies the next scripted carrier event of the viewer's script that no view has applied yet
   * (ops and customers share one catalogue, so an event runs once). Changes nothing once the
   * script is finished.
   */
  simulateCarrierEvent: (viewer: Viewer) => Promise<SimulateCarrierEventResult>
  /** Shipment ids whose exception ops have not opened yet, to mark their inbox cards as new. */
  listUnseenExceptionShipmentIds: () => Promise<string[]>
  /** Clears the "new" marker of one shipment's exception. Idempotent: unknown or seen ids change nothing. */
  markExceptionSeen: (shipmentId: string) => Promise<void>
  /**
   * Notifications the viewer may see, newest first: ops see all of them, a customer only those of
   * their own shipments. Read state is per viewer and left to the caller (see `isNotificationRead`).
   */
  listNotifications: (viewer: Viewer) => Promise<CarrierNotification[]>
  /** Marks one notification read for this viewer only. Idempotent: unknown or read ids change nothing. */
  markNotificationRead: (viewer: Viewer, notificationId: string) => Promise<void>
  /** Restores the seed. */
  resetDemo: () => Promise<void>
}

function findShipment(state: DemoState, shipmentId: string): Shipment {
  const shipment = state.shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new NotFoundError(`Shipment ${shipmentId} not found`)
  }
  return shipment
}

function findException(shipment: Shipment, exceptionId: string): ShipmentException {
  const exception = shipment.exceptions.find(candidate => candidate.id === exceptionId)
  if (!exception) {
    throw new NotFoundError(`Exception ${exceptionId} not found on shipment ${shipment.id}`)
  }
  return exception
}

function getNotificationId(eventId: string): string {
  return `N-${eventId}`
}

/**
 * Applies a scripted event to its shipment inside a `db.write`, adds its notification and returns
 * whether it opened an exception.
 */
function applyScriptedEvent(state: DemoState, event: ScriptedCarrierEvent, receivedAt: string): boolean {
  const shipment = findShipment(state, event.shipmentId)
  const previousRawEvent = shipment.rawEvents.at(-1)
  const rawEventId = `${shipment.id}-E${shipment.rawEvents.length + 1}`

  for (const { legId, changes } of event.legChanges) {
    const leg = shipment.legs.find(candidate => candidate.id === legId)
    if (leg) {
      Object.assign(leg, changes)
    }
  }
  shipment.rawEvents.push({
    id: rawEventId,
    carrierId: event.carrierMessage.carrierId,
    channel: event.carrierMessage.channel,
    receivedAt,
    rawText: event.carrierMessage.rawText,
    normalizedStatus: event.milestone.status,
    mapping: event.carrierMessage.mapping,
  })
  shipment.milestones.push({
    id: `${shipment.id}-M${shipment.milestones.length + 1}`,
    legId: event.milestone.legId,
    status: event.milestone.status,
    location: event.milestone.location,
    occurredAt: receivedAt,
    receivedAt,
    source: 'carrier',
    rawEventIds: [rawEventId],
  })
  shipment.carrierEta = event.carrierEta
  shipment.estimatedEta = event.estimatedEta
  shipment.customerSummary = event.customerSummary
  shipment.documents.push(...event.addedDocuments)
  shipment.erpOrder.requiredDocuments.push(...event.addedRequiredDocuments)
  if (event.clearsAiSignal) {
    delete shipment.aiSignal
  }

  const { exceptionEffect } = event
  if (exceptionEffect.kind === 'closes') {
    shipment.exceptions = []
    state.unseenExceptionShipmentIds = state.unseenExceptionShipmentIds.filter(candidate => candidate !== shipment.id)
  }
  if (exceptionEffect.kind === 'opens') {
    shipment.exceptions.push({
      id: `${shipment.id}-X${shipment.exceptions.length + 1}`,
      type: exceptionEffect.type,
      openedAt: receivedAt,
      aiDiagnosis: {
        summary: exceptionEffect.diagnosis,
        basedOnEventIds: previousRawEvent ? [previousRawEvent.id, rawEventId] : [rawEventId],
      },
      draft: { status: 'pending', body: exceptionEffect.draftBody },
    })
    state.unseenExceptionShipmentIds.push(shipment.id)
  }
  state.appliedEventIds.push(event.id)
  state.notifications.push({
    id: getNotificationId(event.id),
    eventId: event.id,
    shipmentId: shipment.id,
    customerId: shipment.customerId,
    headline: event.headline,
    receivedAt,
    opensException: exceptionEffect.kind === 'opens',
    readBy: [],
  })

  return exceptionEffect.kind === 'opens'
}

/** Creates the fake API over `db`. The app uses the {@link shipmentsApi} instance. */
export function createShipmentsApi({ db, latencyMs = DEFAULT_LATENCY_MS, now = () => new Date(DEMO_NOW_ISO) }: ShipmentsApiOptions): ShipmentsApi {
  /**
   * Runs `operation` after the simulated latency. Reading or writing inside the delayed callback
   * means each call sees the state at the moment it "reaches the server", like a real backend.
   */
  async function respond<Result>(operation: () => Result): Promise<Result> {
    await delay(latencyMs)
    return operation()
  }

  /** Applies a change to one exception's draft and returns the updated shipment. */
  function updatePendingDraft(
    shipmentId: string,
    exceptionId: string,
    change: (exception: ShipmentException) => void,
  ): Shipment {
    db.write((state) => {
      const exception = findException(findShipment(state, shipmentId), exceptionId)
      if (exception.draft.status !== 'pending') {
        throw new ConflictError(`The draft of ${exceptionId} is ${exception.draft.status}, not pending`)
      }
      change(exception)
    })
    return findShipment(db.read(), shipmentId)
  }

  return {
    getReferenceData: () => respond(() => {
      const { customers, sites, carriers } = db.read()
      return { customers, sites, carriers }
    }),

    listShipments: () => respond(() => db.read().shipments),

    listExceptions: () => respond(() => db.read().shipments.filter(shipment => shipment.exceptions.length > 0)),

    getShipment: shipmentId => respond(() => findShipment(db.read(), shipmentId)),

    approveDraft: (shipmentId, exceptionId, body) => respond(() => updatePendingDraft(shipmentId, exceptionId, (exception) => {
      exception.draft = { status: 'sent', body, notifiedAt: now().toISOString() }
    })),

    discardDraft: (shipmentId, exceptionId) => respond(() => updatePendingDraft(shipmentId, exceptionId, (exception) => {
      exception.draft = { status: 'discarded', discardedAt: now().toISOString() }
    })),

    simulateCarrierEvent: viewer => respond(() => {
      const { appliedEventIds } = db.read()
      const receivedAt = now()
      const catalogue = createScriptedEvents(receivedAt)
      const nextEventId = getEventScript(viewer).find(eventId => !appliedEventIds.includes(eventId))
      const event = catalogue.find(candidate => candidate.id === nextEventId)
      if (!event) {
        return { kind: 'scriptFinished' }
      }

      let opensException = false
      db.write((state) => {
        opensException = applyScriptedEvent(state, event, receivedAt.toISOString())
      })
      return {
        kind: 'applied',
        shipment: findShipment(db.read(), event.shipmentId),
        notificationId: getNotificationId(event.id),
        headline: event.headline,
        opensException,
      }
    }),

    listUnseenExceptionShipmentIds: () => respond(() => db.read().unseenExceptionShipmentIds),

    markExceptionSeen: shipmentId => respond(() => {
      db.write((state) => {
        state.unseenExceptionShipmentIds = state.unseenExceptionShipmentIds.filter(candidate => candidate !== shipmentId)
      })
    }),

    listNotifications: viewer => respond(() => {
      const { notifications } = db.read()
      const visible = viewer.role === 'ops'
        ? notifications
        : notifications.filter(notification => notification.customerId === viewer.customerId)
      // Insertion order, not `receivedAt`: the demo clock is frozen, so every timestamp ties.
      return visible.toReversed()
    }),

    markNotificationRead: (viewer, notificationId) => respond(() => {
      const viewerKey = getViewerKey(viewer)
      db.write((state) => {
        const notification = state.notifications.find(candidate => candidate.id === notificationId)
        if (notification && !notification.readBy.includes(viewerKey)) {
          notification.readBy.push(viewerKey)
        }
      })
    }),

    resetDemo: () => respond(() => db.reset()),
  }
}

/** The fake API instance used by the app, backed by `sessionStorage`. */
export const shipmentsApi = createShipmentsApi({ db: createMockDb() })
