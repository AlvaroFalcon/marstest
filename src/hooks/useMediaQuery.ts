import { useSyncExternalStore } from 'react'

/**
 * Viewport at which ops screens switch to their wide layout (list beside detail, table instead of
 * cards, popover instead of bottom sheet). One shared value, so the layout and the portal-based
 * controls it goes with can never disagree.
 */
export const DESKTOP_QUERY = '(min-width: 64rem)'

/**
 * Whether a CSS media query currently matches, re-rendering when it changes.
 *
 * This is the one viewport query of the app. Layout stays on container queries, but Radix portals
 * (popover, sheet) render outside the container they were opened from, so they cannot use them:
 * choosing between a popover and a bottom sheet has to read the viewport. Do not use it for
 * anything a container query or a responsive token can express.
 *
 * @example
 * const isDesktop = useMediaQuery(DESKTOP_QUERY)
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onChange)
      return () => mediaQueryList.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
