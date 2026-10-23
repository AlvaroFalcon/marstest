import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { SimulateCarrierEventResult } from '@/api/shipmentsApi'
import type { RoutedViewer } from '@/hooks/useViewer'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { useViewer } from '@/hooks/useViewer'
import routes from '@/routes'

type AppliedEvent = Extract<SimulateCarrierEventResult, { kind: 'applied' }>

/**
 * Where the toast's "View" action leads: the exception when ops can still open one (the event
 * opened it), otherwise the shipment in the viewer's own area. A closing event leaves ops no
 * exception to open, so they land on the shipment.
 */
function getViewPath(viewer: RoutedViewer, event: AppliedEvent): string {
  if (viewer.role === 'customer') {
    return routes.customer.shipment(viewer.customerId, event.shipment.id)
  }
  if (event.opensException) {
    return routes.ops.exception(event.shipment.id)
  }
  return routes.ops.shipment(event.shipment.id)
}

/**
 * Applies the next scripted carrier event of the current viewer and refreshes everything on
 * screen, so freshness, journey and the inbox order follow. Invalidates every query because an
 * event touches the shipment lists, the detail and the unseen markers alike. `isPending` stays
 * true until the refetch finishes.
 *
 * Feedback is a toast with the event headline and a "View" action to the affected shipment (or
 * its exception, for ops). When the viewer's script is finished the toast says how to run the
 * demo again. Failures show an error toast.
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
          onClick: () => void navigate(getViewPath(viewer, result)),
        },
      })
    },
    onError: () => {
      toast.error(intl.formatMessage({ id: 'demo.simulateFailed' }))
    },
  })
}
