import { delay } from 'es-toolkit'
import { createMockDb } from '@/api/mockDb'
import type { MockDb } from '@/api/mockDb'
import { createSimulatedCarrierEvent, DEMO_NOW, SIMULATED_EVENT_ID, SIMULATED_EVENT_SHIPMENT_ID } from '@/api/seed'
import type { DemoState, ReferenceData, Shipment, ShipmentException } from '@/api/types'

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
   * time so new data stays consistent with the seed, whose dates are relative to `DEMO_NOW`.
   */
  now?: () => Date
}

/** Outcome of {@link ShipmentsApi.simulateCarrierEvent}. */
export type SimulateCarrierEventResult = {
  shipment: Shipment
  /** False when the scripted event had already been applied, so nothing changed. */
  applied: boolean
}

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
  /** Applies the scripted demo event (vessel rolled on SH-1047) once; later calls change nothing. */
  simulateCarrierEvent: () => Promise<SimulateCarrierEventResult>
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

/** Creates the fake API over `db`. The app uses the {@link shipmentsApi} instance. */
export function createShipmentsApi({ db, latencyMs = DEFAULT_LATENCY_MS, now = () => new Date(DEMO_NOW) }: ShipmentsApiOptions): ShipmentsApi {
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

    simulateCarrierEvent: () => respond(() => {
      const current = findShipment(db.read(), SIMULATED_EVENT_SHIPMENT_ID)
      if (current.rawEvents.some(rawEvent => rawEvent.id === SIMULATED_EVENT_ID)) {
        return { shipment: current, applied: false }
      }

      const event = createSimulatedCarrierEvent(now())
      db.write((state) => {
        const shipment = findShipment(state, SIMULATED_EVENT_SHIPMENT_ID)
        shipment.legs = event.legs
        shipment.rawEvents.push(event.rawEvent)
        shipment.milestones.push(event.milestone)
        shipment.carrierEta = event.carrierEta
        shipment.estimatedEta = event.estimatedEta
        shipment.exceptions.push(event.exception)
      })
      return { shipment: findShipment(db.read(), SIMULATED_EVENT_SHIPMENT_ID), applied: true }
    }),

    resetDemo: () => respond(() => db.reset()),
  }
}

/** The fake API instance used by the app, backed by `sessionStorage`. */
export const shipmentsApi = createShipmentsApi({ db: createMockDb() })
