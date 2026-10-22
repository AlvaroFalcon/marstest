import { createMockDb, DEMO_STATE_STORAGE_KEY } from '@/api/mockDb'
import type { DemoStorage } from '@/api/mockDb'
import { createSeed } from '@/api/seed'
import type { DemoState } from '@/api/types'

/** Fake storage that also exposes its items so tests can inspect what was persisted. */
type InspectableStorage = DemoStorage & { items: Map<string, string> }

/** In-memory stand-in for `sessionStorage`, created per test. */
function createFakeStorage(initialItems: Record<string, string> = {}): InspectableStorage {
  const items = new Map(Object.entries(initialItems))
  return {
    items,
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

/** Storage that throws on every call, like a blocked `sessionStorage`. */
function createFailingStorage(): DemoStorage {
  const fail = (): never => {
    throw new Error('SecurityError: storage is disabled')
  }
  return { getItem: fail, setItem: fail }
}

function renameFirstCustomer(name: string): (state: DemoState) => void {
  return (state: DemoState) => {
    state.customers[0].name = name
  }
}

describe('createMockDb', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to memory when the browser blocks sessionStorage', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError: access to sessionStorage is denied')
    })

    const db = createMockDb()
    db.write(renameFirstCustomer('John Smith GmbH'))

    expect(db.read().customers[0].name).toBe('John Smith GmbH')
    expect(db.read().shipments).toEqual(createSeed().shipments)
  })

  it('starts from the seed when storage is empty', () => {
    const storage = createFakeStorage()

    const db = createMockDb({ storage })

    expect(db.read()).toEqual(createSeed())
  })

  it('persists every write so a new database on the same storage keeps the change', () => {
    const storage = createFakeStorage()
    const db = createMockDb({ storage })

    db.write(renameFirstCustomer('John Smith GmbH'))
    const reloadedDb = createMockDb({ storage })

    expect(storage.items.has(DEMO_STATE_STORAGE_KEY)).toBe(true)
    expect(reloadedDb.read().customers[0].name).toBe('John Smith GmbH')
  })

  it('ignores stored state that does not match the schema', () => {
    const storage = createFakeStorage({ [DEMO_STATE_STORAGE_KEY]: JSON.stringify({ shipments: 'broken' }) })

    const db = createMockDb({ storage })

    expect(db.read()).toEqual(createSeed())
  })

  it('accepts a stored state saved before the unseen exceptions field existed', () => {
    const { unseenExceptionShipmentIds, ...legacyState } = createSeed()
    const storage = createFakeStorage({ [DEMO_STATE_STORAGE_KEY]: JSON.stringify(legacyState) })

    const db = createMockDb({ storage })

    expect(unseenExceptionShipmentIds).toEqual([])
    expect(db.read()).toEqual(createSeed())
  })

  it('ignores stored state that is not valid JSON', () => {
    const storage = createFakeStorage({ [DEMO_STATE_STORAGE_KEY]: '{not json' })

    const db = createMockDb({ storage })

    expect(db.read()).toEqual(createSeed())
  })

  it('keeps working in memory when storage throws', () => {
    const db = createMockDb({ storage: createFailingStorage() })

    db.write(renameFirstCustomer('John Smith GmbH'))

    expect(db.read().customers[0].name).toBe('John Smith GmbH')
  })

  it('restores and persists the seed on reset', () => {
    const storage = createFakeStorage()
    const db = createMockDb({ storage })
    db.write(renameFirstCustomer('John Smith GmbH'))

    db.reset()

    expect(db.read()).toEqual(createSeed())
    expect(createMockDb({ storage }).read()).toEqual(createSeed())
  })

  it('returns copies, so changing a read value does not change the store', () => {
    const db = createMockDb({ storage: createFakeStorage() })

    db.read().customers[0].name = 'John Smith GmbH'

    expect(db.read().customers[0].name).toBe('Nordwerk GmbH')
  })

  it('leaves the state unchanged when a write throws', () => {
    const db = createMockDb({ storage: createFakeStorage() })

    const write = () => db.write((state) => {
      state.customers[0].name = 'John Smith GmbH'
      throw new Error('Rejected change')
    })

    expect(write).toThrow('Rejected change')
    expect(db.read().customers[0].name).toBe('Nordwerk GmbH')
  })
})
