import { createMockDb } from '@/api/mockDb'
import type { DemoStorage } from '@/api/mockDb'
import { createSeed } from '@/api/seed'
import { ConflictError, createShipmentsApi, DEFAULT_LATENCY_MS, NotFoundError } from '@/api/shipmentsApi'
import type { ShipmentsApiOptions } from '@/api/shipmentsApi'

const APPROVAL_TIME = new Date('2026-10-20T10:30:00.000Z')

/** Storage that keeps nothing, so every test starts from the seed. */
const noopStorage: DemoStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

function createTestApi(options: Partial<ShipmentsApiOptions> = {}) {
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
    // Arrange
    vi.useFakeTimers()
    const api = createTestApi({ latencyMs: DEFAULT_LATENCY_MS })
    const onResolved = vi.fn()

    // Act
    const request = api.listShipments().then(onResolved)
    await vi.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS - 1)
    const resolvedBeforeLatency = onResolved.mock.calls.length
    await vi.advanceTimersByTimeAsync(1)
    await request

    // Assert
    expect(DEFAULT_LATENCY_MS).toBe(200)
    expect(resolvedBeforeLatency).toBe(0)
    expect(onResolved).toHaveBeenCalledTimes(1)
  })

  it('returns copies, so changing a result does not change the store', async () => {
    // Arrange
    const api = createTestApi()
    const shipment = await api.getShipment('SH-1042')

    // Act
    shipment.cargo = 'Changed by the caller'
    const reloaded = await api.getShipment('SH-1042')

    // Assert
    expect(reloaded.cargo).toBe('Cordless drill assemblies, 6 pallets')
  })

  it('lists every shipment and the reference data', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const shipments = await api.listShipments()
    const referenceData = await api.getReferenceData()

    // Assert
    expect(shipments).toHaveLength(18)
    expect(referenceData.customers).toHaveLength(3)
    expect(referenceData.sites).toHaveLength(4)
    expect(referenceData.carriers).toHaveLength(5)
  })

  it('lists only shipments with an open exception', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const exceptions = await api.listExceptions()

    // Assert
    expect(exceptions.map(shipment => shipment.id).sort()).toEqual(['SH-1029', 'SH-1035', 'SH-1037', 'SH-1042', 'SH-1051', 'SH-1058', 'SH-1060'])
  })

  it('rejects with NotFoundError for an unknown shipment', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const request = api.getShipment('SH-9999')

    // Assert
    await expect(request).rejects.toBeInstanceOf(NotFoundError)
  })

  it('marks an approved draft as sent with the edited body and the approval time', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const shipment = await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John, your shipment is delayed.')

    // Assert
    expect(shipment.exceptions[0].draft).toEqual({
      status: 'sent',
      body: 'Hello John, your shipment is delayed.',
      notifiedAt: '2026-10-20T10:30:00.000Z',
    })
    expect((await api.getShipment('SH-1042')).exceptions[0].draft.status).toBe('sent')
  })

  it('rejects with ConflictError when approving a draft that is no longer pending', async () => {
    // Arrange
    const api = createTestApi()
    await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John')

    // Act
    const request = api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello again')

    // Assert
    await expect(request).rejects.toBeInstanceOf(ConflictError)
  })

  it('rejects with NotFoundError for an unknown exception', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const request = api.discardDraft('SH-1042', 'SH-1042-X9')

    // Assert
    await expect(request).rejects.toBeInstanceOf(NotFoundError)
  })

  it('discards a pending draft', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const shipment = await api.discardDraft('SH-1060', 'SH-1060-X1')

    // Assert
    expect(shipment.exceptions[0].draft).toEqual({ status: 'discarded', discardedAt: '2026-10-20T10:30:00.000Z' })
  })

  it('applies the scripted vessel-rolled event to SH-1047 once', async () => {
    // Arrange
    const api = createTestApi()

    // Act
    const first = await api.simulateCarrierEvent()
    const second = await api.simulateCarrierEvent()
    const exceptions = await api.listExceptions()

    // Assert
    expect(first.applied).toBe(true)
    expect(first.shipment.id).toBe('SH-1047')
    expect(first.shipment.rawEvents.at(-1)?.receivedAt).toBe('2026-10-20T10:30:00.000Z')
    expect(first.shipment.milestones.at(-1)?.status).toBe('vesselRolled')
    expect(first.shipment.carrierEta.status === 'provided' && first.shipment.carrierEta.updatedAt).toBe('2026-10-20T10:30:00.000Z')
    expect(first.shipment.exceptions.map(exception => exception.type)).toEqual(['vesselRolled'])
    expect(second.applied).toBe(false)
    expect(second.shipment).toEqual(first.shipment)
    expect(exceptions).toHaveLength(8)
  })

  it('restores the seed on resetDemo', async () => {
    // Arrange
    const api = createTestApi()
    await api.simulateCarrierEvent()
    await api.approveDraft('SH-1042', 'SH-1042-X1', 'Hello John')

    // Act
    await api.resetDemo()

    // Assert
    expect(await api.listShipments()).toEqual(createSeed().shipments)
  })
})
