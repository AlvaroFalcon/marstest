import { cloneDeep } from 'es-toolkit'
import { createSeed } from '@/api/seed'
import { demoStateSchema } from '@/api/types'
import type { DemoState } from '@/api/types'

/** `sessionStorage` key of the demo state. Bump the version when the schema changes. */
export const DEMO_STATE_STORAGE_KEY = 'marstest:demo-state:v1'

/** The part of the Web Storage API the mock database needs, so tests can pass a fake. */
export type DemoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Options of {@link createMockDb}. */
export type MockDbOptions = {
  /** Where the state is persisted. Defaults to `sessionStorage` (ADR 0034). */
  storage?: DemoStorage
  /** Builds the initial state, used on first load and on `reset()`. Defaults to {@link createSeed}. */
  createInitialState?: () => DemoState
}

/** In-memory demo database persisted to storage. */
export type MockDb = {
  /** Returns a deep copy of the current state, so callers can never mutate the store by accident. */
  read: () => DemoState
  /** Applies `change` to a working copy of the state, then stores and persists it. */
  write: (change: (draft: DemoState) => void) => void
  /** Restores the initial seed and persists it. */
  reset: () => void
}

/**
 * Returns `sessionStorage`, or a storage that keeps nothing when the browser blocks access to it
 * (privacy modes, sandboxed iframes). The state then lives in memory only for this page load.
 */
function resolveSessionStorage(): DemoStorage {
  try {
    return window.sessionStorage
  }
  catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
}

/**
 * Reads the persisted state. Stored data is untrusted (an older schema, a manual edit), so it is
 * validated with zod and ignored when invalid or unreadable.
 */
function loadPersistedState(storage: DemoStorage): { found: true, state: DemoState } | { found: false } {
  try {
    const serialised = storage.getItem(DEMO_STATE_STORAGE_KEY)
    if (serialised === null) {
      return { found: false }
    }
    const result = demoStateSchema.safeParse(JSON.parse(serialised))
    return result.success ? { found: true, state: result.data } : { found: false }
  }
  catch {
    return { found: false }
  }
}

/**
 * Persists the state. Failures (quota exceeded, storage disabled) are swallowed on purpose: the
 * in-memory state stays the source of truth and the demo keeps working without persistence.
 */
function persistState(storage: DemoStorage, state: DemoState): void {
  try {
    storage.setItem(DEMO_STATE_STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // Memory-only fallback: see the JSDoc above.
  }
}

/**
 * Creates the in-memory database behind the fake API. It starts from the persisted state when a
 * valid one exists, otherwise from the seed, so a reload mid-demo keeps approved drafts and
 * simulated events until `reset()` is called.
 */
export function createMockDb({ storage = resolveSessionStorage(), createInitialState = createSeed }: MockDbOptions = {}): MockDb {
  const persisted = loadPersistedState(storage)
  let state = persisted.found ? persisted.state : createInitialState()

  return {
    read: () => cloneDeep(state),
    write: (change) => {
      const draft = cloneDeep(state)
      change(draft)
      state = draft
      persistState(storage, state)
    },
    reset: () => {
      state = createInitialState()
      persistState(storage, state)
    },
  }
}
