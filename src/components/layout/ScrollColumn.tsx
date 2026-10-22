import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ScrollColumnProps = {
  /** Accessible name of the region, announced when keyboard focus lands on the column. */
  label: string
  children: ReactNode
  className?: string
}

/**
 * A column of a side-by-side layout that sticks to the top of the viewport and scrolls on its own,
 * so scrolling one column never moves the other. It is a focusable named region because a
 * scroll container whose end holds nothing focusable cannot otherwise be scrolled by keyboard.
 */
export function ScrollColumn({ label, children, className }: ScrollColumnProps) {
  return (
    <div
      role="region"
      aria-label={label}
      // Focusable so keyboard users can scroll it with the arrow keys.
      tabIndex={0}
      className={cn(
        // Stuck 1.5rem below the viewport top, the page gutter's vertical padding, with the same gap
        // kept below (hence 3rem off the height). The 0.25rem padding keeps the 3px focus ring of
        // the children from being clipped by the scroll container.
        `
          sticky top-6 max-h-[calc(100svh-3rem)] overflow-y-auto rounded-xl p-1 outline-hidden
          focus-visible:ring-3 focus-visible:ring-ring
        `,
        className,
      )}
    >
      {children}
    </div>
  )
}
