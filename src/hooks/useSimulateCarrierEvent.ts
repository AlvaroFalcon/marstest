import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { useViewer } from '@/hooks/useViewer'
import routes from '@/routes'

/**
 * Applies the scripted carrier event (vessel rolled on SH-1060) and refreshes everything on
 * screen, so freshness, journey and the inbox order follow. Invalidates every query because the
 * event touches the shipment lists, the detail and the unseen markers alike. `isPending` stays
 * true until the refetch finishes.
 *
 * Feedback is a toast. Ops viewers get a "View" action that opens the exception; customer viewers
 * get the same text without it (their data updates passively). A repeat click is idempotent and
 * answers with an info toast that tells how to run the demo again. Failures show an error toast.
 */
export function useSimulateCarrierEvent() {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()
  const intl = useIntl()
  const navigate = useNavigate()
  const viewer = useViewer()

  return useMutation({
    mutationFn: () => api.simulateCarrierEvent(),
    onSuccess: async ({ shipment, applied }) => {
      await queryClient.invalidateQueries()
      if (!applied) {
        toast.info(intl.formatMessage({ id: 'demo.simulateAlreadyDone' }))
        return
      }
      const message = intl.formatMessage({ id: 'demo.simulateDone' }, { shipmentId: shipment.id })
      if (viewer.role === 'ops') {
        toast.info(message, {
          action: {
            label: intl.formatMessage({ id: 'demo.simulateView' }),
            onClick: () => void navigate(routes.ops.exception(shipment.id)),
          },
        })
        return
      }
      toast.info(message)
    },
    onError: () => {
      toast.error(intl.formatMessage({ id: 'demo.simulateFailed' }))
    },
  })
}
