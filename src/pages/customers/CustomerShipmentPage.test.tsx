import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { Toaster } from '@/components/ui/sonner'
import { CustomerShipmentPage } from '@/pages/customers/CustomerShipmentPage'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderPageAt(initialPath: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/customers/:customerId/shipments" element={<p>Shipments list</p>} />
        <Route path="/customers/:customerId/shipments/:shipmentId" element={<CustomerShipmentPage />} />
      </Routes>
      <Toaster />
    </>,
    { initialPath, api },
  )
}

async function findTitle(shipmentId: string) {
  return screen.findByRole('heading', { level: 1, name: new RegExp(`^${shipmentId}`) })
}

describe('CustomerShipmentPage', () => {
  describe('shipment of the customer', () => {
    it('shows the in-transit detail of SH-1042 for Nordwerk', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-1042')

      expect(await findTitle('SH-1042')).toHaveTextContent('SH-1042 · Zaragoza → Birmingham')
      expect(screen.getByRole('heading', { name: 'AI summary' })).toBeInTheDocument()
      expect(screen.getByText('Carrier ETA')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Journey' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    })

    it('shows the delivered detail of SH-1009 with the delivery against the plan', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-1009')

      await findTitle('SH-1009')

      expect(screen.getByText('1 day early')).toBeInTheDocument()
      expect(screen.getByText('Final status · no further updates')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download Proof of delivery (signed)' })).toBeInTheDocument()
    })

    it('shows no internal data to the customer', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-1042')

      await findTitle('SH-1042')

      expect(screen.queryByText('Document check')).not.toBeInTheDocument()
      expect(screen.queryByText('AI diagnosis')).not.toBeInTheDocument()
      expect(screen.queryByText(/Hello Nordwerk team/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Exception open/)).not.toBeInTheDocument()
    })

    it('confirms a simulated document download with a toast', async () => {
      const user = userEvent.setup()
      renderPageAt('/customers/nordwerk/shipments/SH-1042')
      await findTitle('SH-1042')

      await user.click(screen.getByRole('button', { name: 'Download Bill of lading' }))

      expect(await screen.findByText('Download started (simulated)')).toBeInTheDocument()
    })
  })

  describe('back link', () => {
    it('returns to the customer list', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-1042')
      await findTitle('SH-1042')

      const link = screen.getByRole('link', { name: 'Back to your shipments' })

      expect(link).toHaveTextContent('Your shipments')
      expect(link).toHaveAttribute('href', '/customers/nordwerk/shipments')
    })

    it('keeps the tab, search and page of the list the customer came from', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-1042?tab=needsAttention&q=4500&page=2')
      await findTitle('SH-1042')

      const link = screen.getByRole('link', { name: 'Back to your shipments' })

      expect(link).toHaveAttribute('href', '/customers/nordwerk/shipments?tab=needsAttention&q=4500&page=2')
    })

    it('navigates to the list when clicked', async () => {
      const user = userEvent.setup()
      renderPageAt('/customers/nordwerk/shipments/SH-1042')
      await findTitle('SH-1042')

      await user.click(screen.getByRole('link', { name: 'Back to your shipments' }))

      expect(screen.getByText('Shipments list')).toBeInTheDocument()
    })
  })

  describe('loading', () => {
    it('shows a skeleton and the back link while the shipment loads', () => {
      const api: ShipmentsApi = { ...createTestApi(), getShipment: () => new Promise(() => {}) }

      renderPageAt('/customers/nordwerk/shipments/SH-1042', api)

      expect(screen.getByRole('status')).toHaveTextContent('Loading the shipment')
      expect(screen.getByRole('link', { name: 'Back to your shipments' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument()
    })

    it('shows the skeleton instead of "Page not found" while the customers load', () => {
      const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => new Promise(() => {}) }

      renderPageAt('/customers/nordwerk/shipments/SH-1042', api)

      expect(screen.getByRole('status')).toHaveTextContent('Loading the shipment')
      expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument()
    })
  })

  describe('errors', () => {
    it('shows a neutral error with the back link when the reference data fails', async () => {
      const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => Promise.reject(new Error('Network down')) }

      renderPageAt('/customers/nordwerk/shipments/SH-1042', api)

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this page. Try again later.')
      expect(screen.getByRole('link', { name: 'Back to your shipments' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument()
    })

    describe('when the shipment fails to load', () => {
      beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true })
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('shows an error with a retry button that loads the shipment', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        const testApi = createTestApi()
        const realGetShipment = testApi.getShipment
        let isFailing = true
        const api: ShipmentsApi = {
          ...testApi,
          getShipment: shipmentId => (isFailing ? Promise.reject(new Error('Network down')) : realGetShipment(shipmentId)),
        }
        renderPageAt('/customers/nordwerk/shipments/SH-1042', api)

        await act(async () => {
          await vi.advanceTimersByTimeAsync(10_000)
        })

        expect(screen.getByRole('alert')).toHaveTextContent('Could not load the shipment')
        expect(screen.getByRole('link', { name: 'Back to your shipments' })).toBeInTheDocument()

        isFailing = false
        await user.click(screen.getByRole('button', { name: 'Try again' }))

        expect(await findTitle('SH-1042')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })
  })

  describe('not found', () => {
    it('shows "Page not found" for a customer id that does not exist', async () => {
      renderPageAt('/customers/unknown-co/shipments/SH-1042')

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /SH-1042/ })).not.toBeInTheDocument()
    })

    it('shows "Page not found" for a shipment id that does not exist', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-9999')

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    })

    it('shows "Page not found" for a shipment of another customer without revealing it', async () => {
      renderPageAt('/customers/nordwerk/shipments/SH-1037')

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.queryByText(/SH-1037/)).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Journey' })).not.toBeInTheDocument()
    })

    it('shows "Page not found" when the shipment of Nordwerk is opened as Alpen', async () => {
      renderPageAt('/customers/alpen-werkzeug/shipments/SH-1042')

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'AI summary' })).not.toBeInTheDocument()
    })
  })
})
