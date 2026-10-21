import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIntl } from 'react-intl'
import { toast } from 'sonner'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'

/**
 * Restores the seed data and refreshes everything on screen. Invalidates every query because the
 * whole demo state changes, then confirms with a toast. It does not navigate: the viewer stays on
 * the current route. `isPending` stays true until the refetch finishes.
 */
export function useResetDemo() {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()
  const intl = useIntl()

  return useMutation({
    mutationFn: () => api.resetDemo(),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      toast.success(intl.formatMessage({ id: 'demo.resetDone' }))
    },
  })
}
