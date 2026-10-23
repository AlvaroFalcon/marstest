import { cn } from '@/lib/utils'
import { useIntl } from 'react-intl'

/** View model of one row: the parent resolves read state and the time label. */
export type NotificationItem = {
  id: string
  headline: string
  isRead: boolean
  /** Already formatted age, e.g. "Just now" or "3 min ago". */
  timeLabel: string
}

export type NotificationListProps = {
  items: NotificationItem[]
  onSelect: (id: string) => void
  className?: string
}

/**
 * Notifications as a list of full-width buttons, newest first as given. Unread rows carry a dot,
 * bold text and a visually hidden "Unread", so the state never depends on colour alone.
 */
export function NotificationList({ items, onSelect, className }: NotificationListProps) {
  const intl = useIntl()

  return (
    <ul className={cn('flex flex-col gap-1', className)}>
      {items.map(item => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="
              flex w-full items-start gap-3 rounded-md p-2 text-left outline-hidden
              focus-visible:ring-3 focus-visible:ring-ring/50
              [@media(hover:hover)]:hover:bg-muted
            "
          >
            <span aria-hidden="true" className="flex h-5 w-2 shrink-0 items-center">
              <span
                className="
                  size-2 rounded-full bg-info
                  data-[read=true]:invisible
                "
                data-read={item.isRead}
              />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className="
                  line-clamp-2 text-sm
                  data-[read=false]:font-semibold
                "
                data-read={item.isRead}
              >
                {!item.isRead && (
                  <span className="sr-only">
                    {intl.formatMessage({ id: 'notifications.unread' })}
                  </span>
                )}
                {` ${item.headline}`}
              </span>
              <span className="text-caption text-muted-foreground">{item.timeLabel}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
