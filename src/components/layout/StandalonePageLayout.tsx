import type { ReactNode } from 'react'
import { PageGutter } from '@/components/layout/PageGutter'

export type StandalonePageLayoutProps = {
  children: ReactNode
}

/**
 * Full-height page outside the app shell (no header or tabs) that still provides the
 * `@container` the page gutter measures. Used by the catch-all route.
 */
export function StandalonePageLayout({ children }: StandalonePageLayoutProps) {
  return (
    <div className="@container flex min-h-svh flex-col">
      <PageGutter>{children}</PageGutter>
    </div>
  )
}
