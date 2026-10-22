import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIntl } from 'react-intl'
import { toast } from 'sonner'
import { ConflictError } from '@/api/shipmentsApi'
import { syncAfterDraftChange } from '@/hooks/draftMutation'
import { shipmentQueryKey } from '@/hooks/useShipment'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'

/**
 * Discards the pending customer notice of one exception. On success the detail cache holds the
 * `discarded` draft, the inbox, list and tab counts are refetched and a short toast confirms
 * (toasts live in the hook, like `useResetDemo`).
 *
 * On a `ConflictError` the detail is refetched and a conflict toast is shown. Any other failure is
 * left to the caller as `isError`, to render inline.
 *
 * @example
 * const discard = useDiscardDraft(shipment.id)
 * discard.mutate(exception.id)
 */
export function useDiscardDraft(shipmentId: string) {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()
  const intl = useIntl()

  return useMutation({
    mutationFn: (exceptionId: string) => api.discardDraft(shipmentId, exceptionId),
    onSuccess: async (shipment) => {
      toast.success(intl.formatMessage({ id: 'recommendedAction.discardSuccess' }))
      await syncAfterDraftChange(queryClient, shipment)
    },
    onError: async (error) => {
      if (error instanceof ConflictError) {
        toast.error(intl.formatMessage({ id: 'recommendedAction.conflict' }))
        await queryClient.invalidateQueries({ queryKey: shipmentQueryKey(shipmentId) })
      }
    },
  })
}
