import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { useViewer } from '@/hooks/useViewer'
import { getNotificationPath } from '@/lib/notifications'

/**
 * Applies the next scripted carrier event of the current viewer and refreshes everything on
 * screen, so freshness, journey and the inbox order follow. Invalidates every query because an
 * event touches the shipment lists, the detail and the unseen markers alike. `isPending` stays
 * true until the refetch finishes.
 *
 * Feedback is a toast with the event headline and a "View" action to the affected shipment (or
 * its exception, for ops). When the viewer's script is finished the toast says how to run the
 * demo again. "View" also marks the event's notification read for the viewer. Failures show an error toast.
 */
export function useSimulateCarrierEvent() {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()
  const intl = useIntl()
  const navigate = useNavigate()
  const viewer = useViewer()

  return useMutation({
    mutationFn: () => api.simulateCarrierEvent(viewer),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries()
      if (result.kind === 'scriptFinished') {
        toast.info(intl.formatMessage({ id: 'demo.simulateScriptFinished' }))
        return
      }
      toast.info(result.headline, {
        action: {
          label: intl.formatMessage({ id: 'demo.simulateView' }),
          onClick: () => {
            // Same effect as opening it from the panel: read for the viewer who triggered it.
            void api.markNotificationRead(viewer, result.notificationId).then(() => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }))
            void navigate(getNotificationPath(viewer, { shipmentId: result.shipment.id, opensException: result.opensException }))
          },
        },
      })
    },
    onError: () => {
      toast.error(intl.formatMessage({ id: 'demo.simulateFailed' }))
    },
  })
}
