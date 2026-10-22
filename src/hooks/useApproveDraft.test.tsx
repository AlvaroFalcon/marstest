import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQuery } from '@tanstack/react-query'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { useApproveDraft } from '@/hooks/useApproveDraft'
import { useDiscardDraft } from '@/hooks/useDiscardDraft'
import { shipmentQueryKey } from '@/hooks/useShipment'
import { useShipmentsApi } from '@/hooks/useShipmentsApi'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function DraftProbe() {
  const api = useShipmentsApi()
  const shipment = useQuery({ queryKey: shipmentQueryKey('SH-1042'), queryFn: () => api.getShipment('SH-1042') })
  const approve = useApproveDraft('SH-1042', 'Nordwerk GmbH')
  const discard = useDiscardDraft('SH-1042')
  const draftStatus = shipment.data?.exceptions[0]?.draft.status ?? 'loading'

  return (
    <>
      <output aria-label="Draft status">{draftStatus}</output>
      <button onClick={() => approve.mutate({ exceptionId: 'SH-1042-X1', body: 'Hello John' })}>Approve</button>
      <button onClick={() => discard.mutate('SH-1042-X1')}>Discard</button>
    </>
  )
}

describe('useApproveDraft and useDiscardDraft', () => {
  it('puts the sent draft in the shipment cache after approving', async () => {
    renderWithProviders(<DraftProbe />)
    await screen.findByText('pending')

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('sent')).toBeInTheDocument()
  })

  it('puts the discarded draft in the shipment cache after discarding', async () => {
    renderWithProviders(<DraftProbe />)
    await screen.findByText('pending')

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

    expect(await screen.findByText('discarded')).toBeInTheDocument()
  })

  it('sends the approved body to the api', async () => {
    const api = createTestApi()
    const approveDraft = vi.fn(api.approveDraft)
    const spiedApi: ShipmentsApi = { ...api, approveDraft }
    renderWithProviders(<DraftProbe />, { api: spiedApi })
    await screen.findByText('pending')

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await screen.findByText('sent')
    expect(approveDraft).toHaveBeenCalledExactlyOnceWith('SH-1042', 'SH-1042-X1', 'Hello John')
  })
})
