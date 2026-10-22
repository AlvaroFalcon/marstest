import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useIntl } from 'react-intl'
import { toast } from 'sonner'
import { ConflictError } from '@/api/shipmentsApi'
import { syncAfterDraftChange } from '@/hooks/draftMutation'
import { shipmentQueryKey } from '@/hooks/useShipment'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'

/** Variables of the approve mutation. */
export type ApproveDraftVariables = {
  exceptionId: string
  /** Final text the ops user approved, possibly edited from the AI draft. */
  body: string
}

/**
 * Approves and "sends" the customer notice of one exception. On success the detail cache holds the
 * `sent` draft, the inbox, list and tab counts are refetched, and a success toast names the
 * customer (toasts live in the hook, like `useResetDemo`). The exception stays open.
 *
 * On a `ConflictError` (the draft was already handled) the detail is refetched and a conflict toast
 * is shown. Any other failure is left to the caller as `isError`, to render inline with the text kept.
 *
 * @param customerName - Resolved by the caller; used in the success toast description.
 */
export function useApproveDraft(shipmentId: string, customerName: string) {
  const api = useShipmentsApi()
  const queryClient = useQueryClient()
  const intl = useIntl()

  return useMutation({
    mutationFn: ({ exceptionId, body }: ApproveDraftVariables) => api.approveDraft(shipmentId, exceptionId, body),
    onSuccess: async (shipment) => {
      toast.success(intl.formatMessage({ id: 'recommendedAction.approveSuccess' }), {
        description: intl.formatMessage({ id: 'recommendedAction.approveSuccessDescription' }, { customerName }),
      })
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
