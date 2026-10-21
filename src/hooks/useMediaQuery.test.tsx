import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { mockMatchMedia, type MockMatchMedia } from '@/test/mockMatchMedia'

describe('useMediaQuery', () => {
  let mediaQuery: MockMatchMedia

  afterEach(() => {
    mediaQuery.restore()
  })

  it('returns true when the query matches', () => {
    mediaQuery = mockMatchMedia(true)

    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'))

    expect(result.current).toBe(true)
  })

  it('returns false when the query does not match', () => {
    mediaQuery = mockMatchMedia(false)

    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'))

    expect(result.current).toBe(false)
  })

  it('updates when the viewport starts matching', () => {
    mediaQuery = mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'))

    act(() => mediaQuery.setMatches(true))

    expect(result.current).toBe(true)
  })

  it('updates when the viewport stops matching', () => {
    mediaQuery = mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(min-width: 64rem)'))

    act(() => mediaQuery.setMatches(false))

    expect(result.current).toBe(false)
  })
})
