import type { NotificationItem } from './NotificationList'
import { BellIcon } from 'lucide-react'
import { useState } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { NotificationList } from './NotificationList'
import { NotificationsEmpty } from './NotificationsEmpty'

export type NotificationPanelStatus = 'loading' | 'error' | 'ready'

export type NotificationBellProps = {
  items: NotificationItem[]
  status: NotificationPanelStatus
  unreadCount: number
  /** True on wide layouts (popover); false renders a bottom sheet. Decided with `useMediaQuery`. */
  isDesktop: boolean
  /** Called with the id of the clicked notification. The panel closes itself afterwards. */
  onSelect: (id: string) => void
  onRetry: () => void
  className?: string
}

type CountBadgeProps = {
  count: number
}

function CountBadge({ count }: CountBadgeProps) {
  if (count === 0) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className="
        absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-info px-1 text-caption
        leading-none font-semibold text-info-foreground
      "
    >
      {count}
    </span>
  )
}

type PanelBodyProps = Pick<NotificationBellProps, 'items' | 'status' | 'onRetry'> & {
  onSelect: (id: string) => void
}

function PanelBody({ items, status, onRetry, onSelect }: PanelBodyProps) {
  const intl = useIntl()

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-3 p-2" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'notifications.error' })}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {intl.formatMessage({ id: 'notifications.retry' })}
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return <NotificationsEmpty />
  }

  return <NotificationList items={items} onSelect={onSelect} />
}

/**
 * Header bell with an unread count and the panel of the viewer's notifications: a popover on wide
 * screens, a bottom sheet on narrow ones (same pattern as the site filter, ADR 0069). The count
 * is part of the button's accessible name and hidden at zero; the visual badge is `aria-hidden`
 * so it is not read twice. The panel closes when a notification is chosen.
 */
export function NotificationBell({
  items,
  status,
  unreadCount,
  isDesktop,
  onSelect,
  onRetry,
  className,
}: NotificationBellProps) {
  const intl = useIntl()
  const [isOpen, setIsOpen] = useState(false)

  function handleSelect(id: string) {
    setIsOpen(false)
    onSelect(id)
  }

  const label = unreadCount === 0
    ? intl.formatMessage({ id: 'notifications.title' })
    : intl.formatMessage({ id: 'notifications.bellLabel' }, { count: unreadCount })

  const trigger = (
    <Button variant="outline" size="icon" aria-label={label} className={cn('relative bg-card', className)}>
      <BellIcon aria-hidden="true" />
      <CountBadge count={unreadCount} />
    </Button>
  )

  const body = <PanelBody items={items} status={status} onRetry={onRetry} onSelect={handleSelect} />

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          aria-label={intl.formatMessage({ id: 'notifications.title' })}
          className="max-h-96 w-96 gap-1 overflow-y-auto p-2"
        >
          {body}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[80svh] rounded-t-xl pb-4">
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="pt-0">
          <SheetTitle className="text-lg">{intl.formatMessage({ id: 'notifications.title' })}</SheetTitle>
          <SheetDescription className="sr-only">
            {intl.formatMessage({ id: 'notifications.description' })}
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4">{body}</div>
      </SheetContent>
    </Sheet>
  )
}
