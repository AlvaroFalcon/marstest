import type { NotificationPanelStatus } from '@/components/notifications/NotificationBell'
import type { NotificationItem } from '@/components/notifications/NotificationList'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { formatElapsedTime } from '@/components/provenance/formatProvenance'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { useMarkNotificationRead } from '@/hooks/useMarkNotificationRead'
import { useNotifications } from '@/hooks/useNotifications'
import { useNow } from '@/hooks/useNow'
import { useViewer } from '@/hooks/useViewer'
import {
  countUnreadNotifications,
  getNotificationAge,
  getNotificationPath,
  isNotificationRead,
} from '@/lib/notifications'

export type NotificationCenterProps = {
  className?: string
}

/**
 * The notification bell wired to the app: the current viewer's notifications, read state and
 * navigation. Choosing a notification marks it read for this viewer and opens the same place as
 * the toast "View".
 */
export function NotificationCenter({ className }: NotificationCenterProps) {
  const intl = useIntl()
  const navigate = useNavigate()
  const viewer = useViewer()
  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const { data = [], isPending, isError, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()

  let status: NotificationPanelStatus = 'ready'
  if (isError) {
    status = 'error'
  }
  else if (isPending) {
    status = 'loading'
  }

  const items: NotificationItem[] = data.map((notification) => {
    const age = getNotificationAge(notification.receivedAt, now)
    return {
      id: notification.id,
      headline: notification.headline,
      isRead: isNotificationRead(notification, viewer),
      timeLabel: age.kind === 'justNow'
        ? intl.formatMessage({ id: 'notifications.time.justNow' })
        : formatElapsedTime(intl, age.elapsed),
    }
  })

  function handleSelect(id: string) {
    const notification = data.find(candidate => candidate.id === id)
    if (!notification) {
      return
    }
    markRead.mutate({ viewer, notificationId: id })
    navigate(getNotificationPath(viewer, notification))
  }

  return (
    <NotificationBell
      items={items}
      status={status}
      unreadCount={countUnreadNotifications(data, viewer)}
      isDesktop={isDesktop}
      onSelect={handleSelect}
      onRetry={() => refetch()}
      className={className}
    />
  )
}
