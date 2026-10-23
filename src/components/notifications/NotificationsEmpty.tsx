import { BellOffIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'

export type NotificationsEmptyProps = {
  className?: string
}

/** Empty state of the panel: says why it is empty and where notifications come from. */
export function NotificationsEmpty({ className }: NotificationsEmptyProps) {
  const intl = useIntl()

  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-8 text-center', className)}>
      <BellOffIcon aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-sm font-semibold">{intl.formatMessage({ id: 'notifications.empty.title' })}</p>
      <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'notifications.empty.description' })}</p>
    </div>
  )
}
