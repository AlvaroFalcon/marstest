import { useQuery } from '@tanstack/react-query'
import { getViewerKey } from '@/lib/notifications'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { useViewer } from '@/hooks/useViewer'

/** Query key prefix of every notification list, to invalidate them all at once. */
export const NOTIFICATIONS_QUERY_KEY = ['notifications']

/**
 * The current viewer's notifications, newest first. Ops get every event, a customer only those of
 * their shipments. Read state is per viewer: use `isNotificationRead` and
 * `countUnreadNotifications` from `@/lib/notifications` with `useViewer()`.
 */
export function useNotifications() {
  const api = useShipmentsApi()
  const viewer = useViewer()

  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, getViewerKey(viewer)],
    queryFn: () => api.listNotifications(viewer),
  })
}
