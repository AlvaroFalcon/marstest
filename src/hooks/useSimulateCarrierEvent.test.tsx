import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { Toaster } from '@/components/ui/sonner'
import { useSimulateCarrierEvent } from '@/hooks/useSimulateCarrierEvent'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function SimulateProbe() {
  const simulate = useSimulateCarrierEvent()

  return <button onClick={() => simulate.mutate()}>Simulate</button>
}

describe('useSimulateCarrierEvent', () => {
  describe('when the api fails', () => {
    it('shows an error toast and no success feedback', async () => {
      const failingApi: ShipmentsApi = {
        ...createTestApi(),
        simulateCarrierEvent: () => Promise.reject(new Error('Network down')),
      }
      renderWithProviders(
        <>
          <SimulateProbe />
          <Toaster />
        </>, { api: failingApi })

      await userEvent.click(screen.getByRole('button', { name: 'Simulate' }))

      expect(await screen.findByText('Could not simulate the carrier event. Try again.')).toBeInTheDocument()
      expect(screen.queryByText(/New carrier event/)).not.toBeInTheDocument()
    })
  })
})
