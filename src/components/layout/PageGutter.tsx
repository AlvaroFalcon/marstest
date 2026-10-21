import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PageGutterProps = {
  children: ReactNode
  className?: string
}

/**
 * Owns the horizontal page gutter so pages set no outer padding. It matches the header's brand
 * bar (1rem narrow, 2.5rem wide) and follows the width of the nearest `@container` ancestor
 * (`AppLayout`) rather than the viewport. It is separate from `AppLayout` because the ops tabs
 * need to span the full width.
 */
export function PageGutter({ children, className }: PageGutterProps) {
  return (
    <div className={cn(`
      flex flex-1 flex-col px-4 py-6
      @xl:px-10
    `, className)}
    >
      {children}
    </div>
  )
}
