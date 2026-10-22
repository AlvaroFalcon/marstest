import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ShipmentsListMessageProps = {
  title: string
  /** Optional recovery button under the title. */
  action: { label: string, onClick: () => void } | null
  /** `alert` announces the message immediately; used for errors. */
  role?: 'alert'
}

/** Centered message that replaces the list: error with retry, or empty results with a way to clear the filters. */
export function ShipmentsListMessage({ title, action, role }: ShipmentsListMessageProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center"
    >
      <SearchX aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-base font-medium">{title}</p>
      {action !== null && (
        <Button variant="outline" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
