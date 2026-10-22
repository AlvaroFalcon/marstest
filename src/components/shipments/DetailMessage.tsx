import type { ReactNode } from 'react'
import { SearchX } from 'lucide-react'

export type DetailMessageProps = {
  title: string
  role?: 'alert'
  action?: ReactNode
}

/** Dashed message card for a detail that cannot be shown (unavailable, failed to load). */
export function DetailMessage({ title, role, action }: DetailMessageProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center"
    >
      <SearchX aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-base font-medium">{title}</p>
      {action}
    </div>
  )
}
