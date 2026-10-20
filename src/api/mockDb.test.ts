import { createMockDb, DEMO_STATE_STORAGE_KEY } from '@/api/mockDb'
import type { DemoStorage } from '@/api/mockDb'
import { createSeed } from '@/api/seed'
import type { DemoState } from '@/api/types'

/** In-memory stand-in for `sessionStorage`, created per test. */
function createFakeStorage(initialItems: Record<string, string> = {}): DemoStorage & { items: Map<string, string> } {
  const items = new Map(Object.entries(initialItems))
  return {
    items,
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
    removeItem: (key) => {
      items.delete(key)
    },
  }
}

/** Storage that throws on every call, like a blocked `sessionStorage`. */
function createFailingStorage(): DemoStorage {
  const fail = (): never => {
    throw new Error('SecurityError: storage is disabled')
  }
  return { getItem: fail, setItem: fail, removeItem: fail }
}

function renameFirstCustomer(name: string) {
  return (state: DemoState) => {
    state.customers[0].name = name
  }
}

describe('createMockDb', () => {
  it('starts from the seed when storage is empty', () => {
    // Arrange
    const storage = createFakeStorage()

    // Act
    const db = createMockDb({ storage })

    // Assert
    expect(db.read()).toEqual(createSeed())
  })

  it('persists every write so a new database on the same storage keeps the change', () => {
    // Arrange
    const storage = createFakeStorage()
    const db = createMockDb({ storage })

    // Act
    db.write(renameFirstCustomer('John Smith GmbH'))
    const reloadedDb = createMockDb({ storage })

    // Assert
    expect(storage.items.has(DEMO_STATE_STORAGE_KEY)).toBe(true)
    expect(reloadedDb.read().customers[0].name).toBe('John Smith GmbH')
  })

  it('ignores stored state that does not match the schema', () => {
    // Arrange
    const storage = createFakeStorage({ [DEMO_STATE_STORAGE_KEY]: JSON.stringify({ shipments: 'broken' }) })

    // Act
    const db = createMockDb({ storage })

    // Assert
    expect(db.read()).toEqual(createSeed())
  })

  it('ignores stored state that is not valid JSON', () => {
    // Arrange
    const storage = createFakeStorage({ [DEMO_STATE_STORAGE_KEY]: '{not json' })

    // Act
    const db = createMockDb({ storage })

    // Assert
    expect(db.read()).toEqual(createSeed())
  })

  it('keeps working in memory when storage throws', () => {
    // Arrange
    const db = createMockDb({ storage: createFailingStorage() })

    // Act
    db.write(renameFirstCustomer('John Smith GmbH'))

    // Assert
    expect(db.read().customers[0].name).toBe('John Smith GmbH')
  })

  it('restores and persists the seed on reset', () => {
    // Arrange
    const storage = createFakeStorage()
    const db = createMockDb({ storage })
    db.write(renameFirstCustomer('John Smith GmbH'))

    // Act
    db.reset()

    // Assert
    expect(db.read()).toEqual(createSeed())
    expect(createMockDb({ storage }).read()).toEqual(createSeed())
  })

  it('returns copies, so changing a read value does not change the store', () => {
    // Arrange
    const db = createMockDb({ storage: createFakeStorage() })

    // Act
    db.read().customers[0].name = 'John Smith GmbH'

    // Assert
    expect(db.read().customers[0].name).toBe('Nordwerk GmbH')
  })

  it('leaves the state unchanged when a write throws', () => {
    // Arrange
    const db = createMockDb({ storage: createFakeStorage() })

    // Act
    const write = () => db.write((state) => {
      state.customers[0].name = 'John Smith GmbH'
      throw new Error('Rejected change')
    })

    // Assert
    expect(write).toThrow('Rejected change')
    expect(db.read().customers[0].name).toBe('Nordwerk GmbH')
  })
})
