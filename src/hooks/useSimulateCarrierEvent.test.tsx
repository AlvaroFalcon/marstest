import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import type { Viewer } from '@/api/types'
import { Toaster } from '@/components/ui/sonner'
import { useLocation } from 'react-router'
import { useSimulateCarrierEvent } from '@/hooks/useSimulateCarrierEvent'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function SimulateProbe() {
  const simulate = useSimulateCarrierEvent()

  return <button onClick={() => simulate.mutate()}>Simulate</button>
}

function CurrentPath() {
  const { pathname } = useLocation()

  return <output aria-label="Current path">{pathname}</output>
}

function renderProbe(initialPath: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <>
      <SimulateProbe />
      <CurrentPath />
      <Toaster />
    </>,
    { initialPath, api },
  )
}

async function applyEvents(api: ShipmentsApi, viewer: Viewer, count: number) {
  for (let click = 0; click < count; click += 1) {
    await api.simulateCarrierEvent(viewer)
  }
}

async function clickSimulate() {
  await userEvent.click(screen.getByRole('button', { name: 'Simulate' }))
}

describe('useSimulateCarrierEvent', () => {
  describe('in the customer view', () => {
    it('shows the headline of the next event and a View action to the customer shipment detail', async () => {
      renderProbe('/customers/nordwerk/shipments')

      await clickSimulate()
      await userEvent.click(await screen.findByRole('button', { name: 'View' }))

      expect(await screen.findByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeInTheDocument()
      expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/nordwerk/shipments/SH-1053')
    })

    it('sends the View action of an event that closes an exception to the customer shipment detail', async () => {
      renderProbe('/customers/alpen-werkzeug/shipments')

      await clickSimulate()
      await userEvent.click(await screen.findByRole('button', { name: 'View' }))

      expect(screen.getByLabelText('Current path')).toHaveTextContent('/customers/alpen-werkzeug/shipments/SH-1037')
    })

    it('shows the finished message without a View action after the last event', async () => {
      const api = createTestApi()
      await applyEvents(api, { role: 'customer', customerId: 'nordwerk' }, 3)
      renderProbe('/customers/nordwerk/shipments', api)

      await clickSimulate()

      expect(await screen.findByText('No more events here. Reset the demo to run them again.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument()
    })
  })

  describe('in the ops view', () => {
    it('shows the SH-1060 headline and a View action to its exception', async () => {
      renderProbe('/ops/exceptions')

      await clickSimulate()
      await userEvent.click(await screen.findByRole('button', { name: 'View' }))

      expect(await screen.findByText('SH-1060: vessel rolled to the next sailing')).toBeInTheDocument()
      expect(screen.getByLabelText('Current path')).toHaveTextContent('/ops/exceptions/SH-1060')
    })

    it('sends the View action of an event that closes an exception to the ops shipment detail', async () => {
      const api = createTestApi()
      await applyEvents(api, { role: 'ops' }, 2)
      renderProbe('/ops/exceptions', api)

      await clickSimulate()
      await userEvent.click(await screen.findByRole('button', { name: 'View' }))

      expect(await screen.findByText('SH-1042: customs released the container')).toBeInTheDocument()
      expect(screen.getByLabelText('Current path')).toHaveTextContent('/ops/shipments/SH-1042')
    })

    it('sends the View action of an event with no exception to the ops shipment detail', async () => {
      const api = createTestApi()
      await applyEvents(api, { role: 'ops' }, 6)
      renderProbe('/ops/exceptions', api)

      await clickSimulate()
      await userEvent.click(await screen.findByRole('button', { name: 'View' }))

      expect(await screen.findByText('SH-1033: delivered in Basel, proof of delivery received')).toBeInTheDocument()
      expect(screen.getByLabelText('Current path')).toHaveTextContent('/ops/shipments/SH-1033')
    })
  })

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
      expect(screen.queryByText(/vessel rolled/)).not.toBeInTheDocument()
    })
  })
})
