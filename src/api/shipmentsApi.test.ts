import { createMockDb } from '@/api/mockDb'
import type { DemoStorage } from '@/api/mockDb'
import { createSeed } from '@/api/seed'
import { ConflictError, createShipmentsApi, DEFAULT_LATENCY_MS, NotFoundError } from '@/api/shipmentsApi'
import type { ShipmentsApi, ShipmentsApiOptions } from '@/api/shipmentsApi'

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

  it('applies the scripted vessel-rolled event to SH-1060 once', async () => {
    const api = createTestApi()

    const first = await api.simulateCarrierEvent()
    const second = await api.simulateCarrierEvent()
    const exceptions = await api.listExceptions()

    expect(first.applied).toBe(true)
    expect(first.shipment.id).toBe('SH-1060')
    expect(first.shipment.rawEvents.at(-1)?.receivedAt).toBe('2026-10-20T10:30:00.000Z')
    expect(first.shipment.milestones.at(-1)?.status).toBe('vesselRolled')
    expect(first.shipment.legs[1]).toMatchObject({ vessel: 'Mareline Poniente', voyage: 'ML-0846' })
    expect(new Set(first.shipment.rawEvents.map(rawEvent => rawEvent.id)).size).toBe(first.shipment.rawEvents.length)
    expect(new Set(first.shipment.milestones.map(milestone => milestone.id)).size).toBe(first.shipment.milestones.length)
    expect(first.shipment.carrierEta).toMatchObject({ status: 'provided', updatedAt: '2026-10-20T10:30:00.000Z' })
    expect(first.shipment.exceptions.map(exception => exception.type)).toEqual(['vesselRolled'])
    expect(second.applied).toBe(false)
    expect(second.shipment).toEqual(first.shipment)
    expect(exceptions).toHaveLength(7)
  })

  it('marks SH-1060 as unseen only once the event is applied', async () => {
    const api = createTestApi()
    const before = await api.listUnseenExceptionShipmentIds()

    await api.simulateCarrierEvent()
    await api.simulateCarrierEvent()
    const after = await api.listUnseenExceptionShipmentIds()

    expect(before).toEqual([])
    expect(after).toEqual(['SH-1060'])
  })

  it('clears the unseen marker when the exception is marked as seen, and ignores repeats', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent()

    await api.markExceptionSeen('SH-1060')
    await api.markExceptionSeen('SH-1060')

    expect(await api.listUnseenExceptionShipmentIds()).toEqual([])
  })

  it('clears the unseen marker on resetDemo', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent()

    await api.resetDemo()

    expect(await api.listUnseenExceptionShipmentIds()).toEqual([])
  })

  it('restores the seed on resetDemo', async () => {
    const api = createTestApi()
    await api.simulateCarrierEvent()
    await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John')

    await api.resetDemo()

    expect(await api.listShipments()).toEqual(createSeed().shipments)
  })
})
