import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { OpsShipmentPage } from '@/pages/ops/OpsShipmentPage'
import { Toaster } from '@/components/ui/sonner'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function LocationProbe() {
  const location = useLocation()

  return <output aria-label="Current URL">{location.pathname + location.search}</output>
}

function renderPageAt(initialPath: string) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/ops/shipments" element={<p>Shipments list</p>} />
        <Route path="/ops/shipments/:shipmentId" element={<OpsShipmentPage />} />
        <Route path="/ops/exceptions/:shipmentId" element={<p>Exception detail</p>} />
      </Routes>
      <LocationProbe />
      <Toaster />
    </>,
    { initialPath, api: createTestApi() },
  )
}

async function findTitle(shipmentId: string) {
  return screen.findByRole('heading', { level: 1, name: new RegExp(`^${shipmentId}`) })
}

describe('OpsShipmentPage', () => {
  describe('on track (SH-1033)', () => {
    it('shows the estimate in line, no open exception and no AI signal', async () => {
      renderPageAt('/ops/shipments/SH-1033')

      await findTitle('SH-1033')

      expect(screen.getByText('On time')).toBeInTheDocument()
      expect(screen.getAllByText('No open exception')).not.toHaveLength(0)
      expect(screen.getByText('In line with the carrier ETA, no deviation expected')).toBeInTheDocument()
      expect(screen.queryByText(/^AI signal/)).not.toBeInTheDocument()
    })

    it('offers only manual actions with a note that nothing needs attention', async () => {
      renderPageAt('/ops/shipments/SH-1033')

      const actions = await screen.findByRole('region', { name: 'Actions' })

      expect(within(actions).getByText('Nothing needs your attention.')).toBeInTheDocument()
      expect(within(actions).getAllByRole('button').map(button => button.textContent)).toEqual([
        'Contact carrier (EuroRuta)',
        'Message customer',
        'Copy customer tracking link',
      ])
      expect(within(actions).queryByRole('link')).not.toBeInTheDocument()
    })

    it('confirms a simulated action with a toast', async () => {
      renderPageAt('/ops/shipments/SH-1033')

      await userEvent.click(await screen.findByRole('button', { name: 'Copy customer tracking link' }))

      expect(await screen.findByText('Customer tracking link copied (simulated)')).toBeInTheDocument()
    })
  })

  describe('watching (SH-1034)', () => {
    it('shows the AI signal, the watching badge and no exception yet', async () => {
      renderPageAt('/ops/shipments/SH-1034')

      await findTitle('SH-1034')

      expect(screen.getByText('Watching')).toBeInTheDocument()
      expect(screen.getAllByText('Possible delay · no exception yet')).not.toHaveLength(0)
      expect(screen.getByRole('heading', { name: 'AI signal · possible delay' })).toBeInTheDocument()
      expect(screen.getByText(/the last GPS position reports 12 km\/h on the A-8 near Nice/)).toBeInTheDocument()
    })

    it('does not alert the customer yet and suggests asking the carrier to confirm', async () => {
      renderPageAt('/ops/shipments/SH-1034')

      const actions = await screen.findByRole('region', { name: 'Actions' })

      expect(within(actions).getByText('Not alerting the customer yet (confidence below 75%).')).toBeInTheDocument()
      expect(within(actions).getByRole('button', { name: 'Ask EuroRuta to confirm ETA (AI draft)' })).toBeInTheDocument()
      expect(within(actions).queryByRole('link')).not.toBeInTheDocument()
    })

    it('opens the source events from the AI evidence and closes them with Escape', async () => {
      renderPageAt('/ops/shipments/SH-1034')

      await userEvent.click(await screen.findByRole('button', { name: 'Based on 9 GPS pings and 1 traffic feed' }))

      expect(await screen.findByRole('dialog', { name: 'Source events · SH-1034' })).toBeInTheDocument()
      expect(screen.getByLabelText('Current URL')).toHaveTextContent('/ops/shipments/SH-1034?events=open')
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })
  })

  describe('predicted delay (SH-1035)', () => {
    it('shows the AI signal, the at risk badge and the exception opened automatically', async () => {
      renderPageAt('/ops/shipments/SH-1035')

      await findTitle('SH-1035')

      expect(screen.getByText('At risk')).toBeInTheDocument()
      expect(screen.getAllByText('Exception opened automatically')).not.toHaveLength(0)
      expect(screen.getByRole('heading', { name: 'AI signal · delay very likely' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'AI diagnosis' })).not.toBeInTheDocument()
    })

    it('links to the inbox and to the draft review', async () => {
      renderPageAt('/ops/shipments/SH-1035')

      const actions = await screen.findByRole('region', { name: 'Actions' })

      expect(within(actions).getByText('Exception opened: confidence above 75%. Draft ready for review.')).toBeInTheDocument()
      expect(within(actions).getByRole('link', { name: 'Review AI draft to customer' })).toHaveAttribute('href', '/ops/exceptions/SH-1035')
      expect(within(actions).getByRole('link', { name: 'Open in exceptions inbox' })).toHaveAttribute('href', '/ops/exceptions/SH-1035')
      expect(within(actions).getByRole('button', { name: 'Ask Transauto for a new delivery slot' })).toBeInTheDocument()
    })

    it('navigates to the exception when the inbox link is followed', async () => {
      renderPageAt('/ops/shipments/SH-1035')

      await userEvent.click(await screen.findByRole('link', { name: 'Open in exceptions inbox' }))

      expect(await screen.findByText('Exception detail')).toBeInTheDocument()
    })
  })

  describe('other states', () => {
    it('shows the exception layer for a customs hold, without the AI signal', async () => {
      renderPageAt('/ops/shipments/SH-1042')

      await findTitle('SH-1042')

      expect(screen.getByText('Customs hold')).toBeInTheDocument()
      expect(screen.getAllByText('Exception open · Oct 19')).not.toHaveLength(0)
      expect(screen.getByRole('heading', { name: 'AI diagnosis' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Open in exceptions inbox' })).toHaveAttribute('href', '/ops/exceptions/SH-1042')
    })

    it('shows a delivered shipment with manual customer actions only', async () => {
      renderPageAt('/ops/shipments/SH-1009')

      await findTitle('SH-1009')

      expect(screen.getByText('Delivered')).toBeInTheDocument()
      expect(screen.getByText('Delivered. Nothing needs your attention.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Contact carrier/ })).not.toBeInTheDocument()
    })

    it('shows the document check on every state', async () => {
      renderPageAt('/ops/shipments/SH-1033')

      expect(await screen.findByRole('heading', { name: 'Document check' })).toBeInTheDocument()
    })
  })

  describe('navigation and errors', () => {
    it('returns to the list keeping its search params and dropping the sheet param', async () => {
      renderPageAt('/ops/shipments/SH-1033?status=onTime&page=2&events=open')
      await screen.findByRole('dialog')

      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await userEvent.click(screen.getByRole('link', { name: 'Back to all shipments' }))

      expect(await screen.findByText('Shipments list')).toBeInTheDocument()
      expect(screen.getByLabelText('Current URL')).toHaveTextContent('/ops/shipments?status=onTime&page=2')
    })

    it('shows the unavailable message for an unknown id and keeps the back link', async () => {
      renderPageAt('/ops/shipments/SH-9999')

      expect(await screen.findByText('This shipment isn\'t available')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to all shipments' })).toHaveAttribute('href', '/ops/shipments')
    })

    it('shows the same unavailable message for a shipment outside the ops scope', async () => {
      renderPageAt('/ops/shipments/SH-1058')

      expect(await screen.findByText('This shipment isn\'t available')).toBeInTheDocument()
    })
  })
})
