import type { Viewer } from '@/api/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'

/** Variables of the mark-read mutation: the viewer is explicit so callers pick whose read state changes. */
export type MarkNotificationReadVariables = {
  viewer: Viewer
  notificationId: string
}

/**
 * Marks one notification read for the given viewer only, then refreshes the notification lists.
 * The viewer travels with `mutate` (not read from the hook) so a callback created earlier, such as
 * a toast action, marks read for the viewer that was active when it was created.
 * Failures are ignored on purpose: the notification simply stays unread and nothing is surfaced.
 */
export function useMarkNotificationRead() {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ viewer, notificationId }: MarkNotificationReadVariables) =>
      api.markNotificationRead(viewer, notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  })
}
