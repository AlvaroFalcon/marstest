import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { useViewer } from '@/hooks/useViewer'
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications'

/**
 * Marks one notification read for the current viewer only, then refreshes the notification lists.
 * Failures are ignored on purpose: the notification simply stays unread.
 */
export function useMarkNotificationRead() {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()
  const viewer = useViewer()

  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationRead(viewer, notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  })
}
