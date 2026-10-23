import { createMockDb } from '@/api/mockDb'
import type { DemoStorage } from '@/api/mockDb'
import { createSeed } from '@/api/seed'
import { ConflictError, createShipmentsApi, DEFAULT_LATENCY_MS, NotFoundError } from '@/api/shipmentsApi'
import type { ShipmentsApi, ShipmentsApiOptions, SimulateCarrierEventResult } from '@/api/shipmentsApi'
import type { Viewer } from '@/api/types'
import { buildJourney } from '@/lib/journey'

const APPROVAL_TIME = new Date('2026-10-20T10:30:00.000Z')

/** Storage that keeps nothing, so every test starts from the seed. */
const noopStorage: DemoStorage = { getItem: () => null, setItem: () => {} }

function createTestApi(options: Partial<ShipmentsApiOptions> = {}): ShipmentsApi {
  return createShipmentsApi({
    db: createMockDb({ storage: noopStorage }),
    latencyMs: 0,
    now: () => APPROVAL_TIME,
    ...options,
  })
}

const nordwerk: Viewer = { role: 'customer', customerId: 'nordwerk' }
const alpen: Viewer = { role: 'customer', customerId: 'alpen-werkzeug' }
const brenner: Viewer = { role: 'customer', customerId: 'brenner-iberia' }
const ops: Viewer = { role: 'ops' }

async function simulateTimes(api: ShipmentsApi, viewer: Viewer, times: number): Promise<SimulateCarrierEventResult[]> {
  const results: SimulateCarrierEventResult[] = []
  for (let click = 0; click < times; click += 1) {
    results.push(await api.simulateCarrierEvent(viewer))
  }
  return results
}

function appliedShipmentIds(results: SimulateCarrierEventResult[]): string[] {
  return results.map(result => (result.kind === 'applied' ? result.shipment.id : 'finished'))
}

describe('createShipmentsApi', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves only after the simulated latency', async () => {
    vi.useFakeTimers()
    const api = createTestApi({ latencyMs: DEFAULT_LATENCY_MS })
    const onResolved = vi.fn()

    const request = api.listShipments().then(onResolved)
    await vi.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS - 1)
    const resolvedBeforeLatency = onResolved.mock.calls.length
    await vi.advanceTimersByTimeAsync(1)
    await request

    expect(resolvedBeforeLatency).toBe(0)
    expect(onResolved).toHaveBeenCalledTimes(1)
  })

  it('returns copies, so changing a result does not change the store', async () => {
    const api = createTestApi()
    const shipment = await api.getShipment('SH-1042')

    shipment.cargo = 'Changed by the caller'
    const reloaded = await api.getShipment('SH-1042')

    expect(reloaded.cargo).toBe('Cordless drill assemblies, 6 pallets')
  })

  it('lists every shipment and the reference data', async () => {
    const api = createTestApi()

    const shipments = await api.listShipments()
    const referenceData = await api.getReferenceData()

    expect(shipments).toHaveLength(18)
    expect(referenceData.customers).toHaveLength(3)
    expect(referenceData.sites).toHaveLength(4)
    expect(referenceData.carriers).toHaveLength(5)
  })

  it('lists only shipments with an open exception', async () => {
    const api = createTestApi()

    const exceptions = await api.listExceptions()

    expect(exceptions.map(shipment => shipment.id).sort()).toEqual(['SH-1029', 'SH-1035', 'SH-1037', 'SH-1042', 'SH-1051', 'SH-1058'])
  })

  it('rejects with NotFoundError for an unknown shipment', async () => {
    const api = createTestApi()

    const request = api.getShipment('SH-9999')

    await expect(request).rejects.toBeInstanceOf(NotFoundError)
  })

  it('marks an approved draft as sent with the edited body and the approval time', async () => {
    const api = createTestApi()

    const shipment = await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John, your shipment is delayed.')

    expect(shipment.exceptions[0].draft).toEqual({
      status: 'sent',
      body: 'Hello John, your shipment is delayed.',
      notifiedAt: '2026-10-20T10:30:00.000Z',
    })
    expect((await api.getShipment('SH-1042')).exceptions[0].draft.status).toBe('sent')
  })

  it('rejects with ConflictError when approving a draft that is no longer pending', async () => {
    const api = createTestApi()
    await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John')

    const request = api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello again')

    await expect(request).rejects.toBeInstanceOf(ConflictError)
  })

  it('rejects with NotFoundError for an unknown exception', async () => {
    const api = createTestApi()

    const request = api.discardDraft('SH-1042', 'SH-1042-X9')

    await expect(request).rejects.toBeInstanceOf(NotFoundError)
  })

  it('discards a pending draft', async () => {
    const api = createTestApi()

    const shipment = await api.discardDraft('SH-1051', 'SH-1051-X1')

    expect(shipment.exceptions[0].draft).toEqual({ status: 'discarded', discardedAt: '2026-10-20T10:30:00.000Z' })
  })

  it('applies the scripted vessel-rolled event to SH-1060 first for ops', async () => {
    const api = createTestApi()

    const first = await api.simulateCarrierEvent({ role: 'ops' })
    const exceptions = await api.listExceptions()

    if (first.kind !== 'applied') {
      throw new Error('Expected the first ops event to be applied')
    }
    expect(first.shipment.id).toBe('SH-1060')
    expect(first.opensException).toBe(true)
    expect(first.shipment.rawEvents.at(-1)?.receivedAt).toBe('2026-10-20T10:30:00.000Z')
    expect(first.shipment.milestones.at(-1)?.status).toBe('vesselRolled')
    expect(first.shipment.legs[1]).toMatchObject({ vessel: 'Mareline Poniente', voyage: 'ML-0846' })
    expect(new Set(first.shipment.rawEvents.map(rawEvent => rawEvent.id)).size).toBe(first.shipment.rawEvents.length)
    expect(new Set(first.shipment.milestones.map(milestone => milestone.id)).size).toBe(first.shipment.milestones.length)
    expect(first.shipment.carrierEta).toMatchObject({ status: 'provided', updatedAt: '2026-10-20T10:30:00.000Z' })
    expect(first.shipment.exceptions.map(exception => exception.type)).toEqual(['vesselRolled'])
    expect(first.shipment.customerSummary).toContain('we expect it in Le Havre on Oct 25–26 instead of Oct 22')
    expect(exceptions).toHaveLength(7)
  })

  it('marks SH-1060 as unseen once the event is applied', async () => {
    const api = createTestApi()
    const before = await api.listUnseenExceptionShipmentIds()

    await api.simulateCarrierEvent({ role: 'ops' })
    const after = await api.listUnseenExceptionShipmentIds()

    expect(before).toEqual([])
    expect(after).toEqual(['SH-1060'])
  })

  it('clears the unseen marker when the exception is marked as seen, and ignores repeats', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'ops' })

    await api.markExceptionSeen('SH-1060')
    await api.markExceptionSeen('SH-1060')

    expect(await api.listUnseenExceptionShipmentIds()).toEqual([])
  })

  it('clears the unseen marker on resetDemo', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'ops' })

    await api.resetDemo()

    expect(await api.listUnseenExceptionShipmentIds()).toEqual([])
  })

  it('restores the seed on resetDemo', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent({ role: 'ops' })
    await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John')

    await api.resetDemo()

    expect(await api.listShipments()).toEqual(createSeed().shipments)
  })
})

describe('simulateCarrierEvent', () => {
  describe('customer script', () => {
    it('applies the next event of the customer on each click', async () => {
      const api = createTestApi()

      const results = await simulateTimes(api, nordwerk, 3)

      expect(appliedShipmentIds(results)).toEqual(['SH-1053', 'SH-1042', 'SH-1035'])
      expect(results.map(result => (result.kind === 'applied' ? result.headline : ''))).toEqual([
        'SH-1053: vessel waiting for a berth in Rotterdam',
        'SH-1042: customs released the container',
        'SH-1035: a second driver took over, truck back on the road',
      ])
    })

    it('finishes after the third click and changes nothing', async () => {
      const api = createTestApi()
      await simulateTimes(api, nordwerk, 3)
      const before = await api.listShipments()
      const unseenBefore = await api.listUnseenExceptionShipmentIds()

      const fourth = await api.simulateCarrierEvent(nordwerk)

      expect(fourth).toEqual({ kind: 'scriptFinished' })
      expect(await api.listShipments()).toEqual(before)
      expect(await api.listUnseenExceptionShipmentIds()).toEqual(unseenBefore)
    })

    it('finishes straight away for a customer without a script', async () => {
      const api = createTestApi()

      const result = await api.simulateCarrierEvent({ role: 'customer', customerId: 'unknown-customer' })

      expect(result).toEqual({ kind: 'scriptFinished' })
    })

    it('does not touch the scripts of the other customers', async () => {
      const api = createTestApi()
      await simulateTimes(api, nordwerk, 3)

      const results = await simulateTimes(api, alpen, 3)

      expect(appliedShipmentIds(results)).toEqual(['SH-1037', 'SH-1066', 'SH-1033'])
    })
  })

  describe('ops script', () => {
    it('walks the nine events in order and then finishes', async () => {
      const api = createTestApi()

      const results = await simulateTimes(api, ops, 10)

      expect(appliedShipmentIds(results)).toEqual([
        'SH-1060', 'SH-1053', 'SH-1042', 'SH-1035', 'SH-1037', 'SH-1066', 'SH-1033', 'SH-1029', 'SH-1048', 'finished',
      ])
    })

    it('leaves no problem step on a shipment without exceptions after all nine events', async () => {
      const api = createTestApi()
      await simulateTimes(api, ops, 9)

      const shipments = await api.listShipments()

      const inconsistentShipmentIds = shipments
        .filter(shipment => shipment.exceptions.length === 0)
        .filter(shipment => buildJourney(shipment, APPROVAL_TIME).some(step => step.state === 'problem'))
        .map(shipment => shipment.id)
      expect(inconsistentShipmentIds).toEqual([])
    })

    it('shows the Southampton step of SH-1042 as customs cleared once the container is released', async () => {
      const api = createTestApi()
      await simulateTimes(api, ops, 3)

      const steps = buildJourney(await api.getShipment('SH-1042'), APPROVAL_TIME)

      const southampton = steps.find(step => step.place === 'Southampton port')
      expect(southampton?.state).toBe('done')
      expect(southampton?.status).toBe('customsCleared')
    })

    it('shows SH-1029 out for delivery in Seville after the carrier update', async () => {
      const api = createTestApi()
      await simulateTimes(api, ops, 8)

      const steps = buildJourney(await api.getShipment('SH-1029'), APPROVAL_TIME)

      expect(steps.some(step => step.place.includes('Seville') && step.status === 'outForDelivery')).toBe(true)
    })

    it('skips an event already applied from a customer view', async () => {
      const api = createTestApi()
      await api.simulateCarrierEvent(nordwerk)

      const results = await simulateTimes(api, ops, 2)

      expect(appliedShipmentIds(results)).toEqual(['SH-1060', 'SH-1042'])
    })

    it('shows in the ops exception list an exception opened from a customer view', async () => {
      const api = createTestApi()
      await api.simulateCarrierEvent(nordwerk)

      const exceptionShipmentIds = (await api.listExceptions()).map(shipment => shipment.id)

      expect(exceptionShipmentIds).toContain('SH-1053')
    })

    it('lets a customer skip the events ops already applied', async () => {
      const api = createTestApi()
      await simulateTimes(api, ops, 2)

      const results = await simulateTimes(api, nordwerk, 3)

      expect(appliedShipmentIds(results)).toEqual(['SH-1042', 'SH-1035', 'finished'])
    })
  })

  describe('events that open an exception', () => {
    it('opens a predicted delay with a pending draft on SH-1053 and marks it unseen', async () => {
      const api = createTestApi()

      const [result] = await simulateTimes(api, nordwerk, 1)

      if (result.kind !== 'applied') {
        throw new Error('Expected the event to be applied')
      }
      expect(result.opensException).toBe(true)
      expect(result.shipment.exceptions.map(exception => exception.type)).toEqual(['predictedDelay'])
      expect(result.shipment.exceptions[0].draft.status).toBe('pending')
      expect(await api.listUnseenExceptionShipmentIds()).toEqual(['SH-1053'])
    })
  })

  describe('events that close an exception', () => {
    it('removes the customs hold of SH-1042 from the exception list', async () => {
      const api = createTestApi()

      const [, result] = await simulateTimes(api, nordwerk, 2)
      const exceptionShipmentIds = (await api.listExceptions()).map(shipment => shipment.id)

      if (result.kind !== 'applied') {
        throw new Error('Expected the event to be applied')
      }
      expect(result.opensException).toBe(false)
      expect(result.shipment.exceptions).toEqual([])
      expect(exceptionShipmentIds).not.toContain('SH-1042')
    })

    it('clears the exception and the AI signal of SH-1035', async () => {
      const api = createTestApi()
      const before = await api.getShipment('SH-1035')

      const results = await simulateTimes(api, nordwerk, 3)
      const shipment = await api.getShipment('SH-1035')

      expect(results.at(-1)?.kind).toBe('applied')
      expect(before.aiSignal).toBeDefined()
      expect(shipment.exceptions).toEqual([])
      expect(shipment.aiSignal).toBeUndefined()
    })

    it('clears the exception and the AI signal of SH-1037', async () => {
      const api = createTestApi()
      const before = await api.getShipment('SH-1037')

      await api.simulateCarrierEvent(alpen)
      const shipment = await api.getShipment('SH-1037')

      expect(before.exceptions).toHaveLength(1)
      expect(before.aiSignal).toBeDefined()
      expect(shipment.exceptions).toEqual([])
      expect(shipment.aiSignal).toBeUndefined()
    })

    it('closes the stale tracking of SH-1029 and keeps the exceptions of other shipments', async () => {
      const api = createTestApi()

      await simulateTimes(api, brenner, 2)
      const exceptionShipmentIds = (await api.listExceptions()).map(shipment => shipment.id).sort()

      expect(exceptionShipmentIds).toEqual(['SH-1035', 'SH-1037', 'SH-1042', 'SH-1051', 'SH-1058', 'SH-1060'])
    })

    it('keeps the unseen markers of other shipments when an exception closes', async () => {
      const api = createTestApi()

      await simulateTimes(api, nordwerk, 2)

      expect(await api.listUnseenExceptionShipmentIds()).toEqual(['SH-1053'])
    })
  })

  describe('events without exceptions', () => {
    it('adds a received proof of delivery to SH-1033 and requires it', async () => {
      const api = createTestApi()
      const before = await api.getShipment('SH-1033')

      await simulateTimes(api, alpen, 3)
      const shipment = await api.getShipment('SH-1033')

      expect(before.documents.find(document => document.type === 'proofOfDelivery')).toBeUndefined()
      expect(shipment.documents.find(document => document.type === 'proofOfDelivery')?.status).toBe('received')
      expect(shipment.erpOrder.requiredDocuments).toContain('proofOfDelivery')
      expect(shipment.milestones.at(-1)?.status).toBe('delivered')
    })

    it('does not mark the shipment as unseen', async () => {
      const api = createTestApi()

      await simulateTimes(api, alpen, 3)

      expect(await api.listUnseenExceptionShipmentIds()).toEqual([])
    })
  })

  describe('resetDemo', () => {
    it('restarts every script from its first event', async () => {
      const api = createTestApi()
      await simulateTimes(api, nordwerk, 3)
      await simulateTimes(api, ops, 2)

      await api.resetDemo()
      const customerResults = await simulateTimes(api, nordwerk, 1)
      const opsResults = await simulateTimes(api, ops, 1)

      expect(appliedShipmentIds(customerResults)).toEqual(['SH-1053'])
      expect(appliedShipmentIds(opsResults)).toEqual(['SH-1060'])
    })
  })
})
