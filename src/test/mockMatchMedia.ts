export type MockMatchMedia = {
  /** Changes whether every query matches and notifies the registered `change` listeners. */
  setMatches: (matches: boolean) => void
  /** Puts back the `matchMedia` that was installed before the mock. */
  restore: () => void
}

/**
 * Replaces `window.matchMedia` with a controllable fake: every query matches or not together, and
 * `setMatches` fires `change` events like a real viewport resize would. Call `restore` in
 * `afterEach` so the stub does not leak into other tests.
 */
export function mockMatchMedia(initialMatches: boolean): MockMatchMedia {
  const originalMatchMedia = window.matchMedia
  let currentMatches = initialMatches
  const listeners = new Set<() => void>()

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      get matches() {
        return currentMatches
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: unknown) => {
        if (typeof listener === 'function') {
          listeners.add(() => listener())
        }
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  return {
    setMatches: (matches) => {
      currentMatches = matches
      for (const listener of listeners) listener()
    },
    restore: () => {
      Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: originalMatchMedia })
    },
  }
}
