import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSeed } from '@/api/seed'
import type { Shipment } from '@/api/types'
import { CustomerShipmentDetail } from '@/components/customer/CustomerShipmentDetail'
import { Toaster } from '@/components/ui/sonner'
import { buildCustomerShipmentDetail } from '@/lib/customerShipmentDetail'
import { renderWithProviders } from '@/test/renderWithProviders'

const NOW = new Date('2026-10-20T10:00:00.000Z')

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

function renderDetail(shipment: Shipment) {
  const { customers, sites, carriers } = createSeed()

  return renderWithProviders(
    <>
      <CustomerShipmentDetail
        shipment={shipment}
        detail={buildCustomerShipmentDetail(shipment, { customers, sites, carriers }, NOW)}
        now={NOW}
      />
      <Toaster />
    </>,
  )
}

describe('CustomerShipmentDetail', () => {
  describe('header', () => {
    it('shows the title with the id and the route, and the list status', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.getByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeInTheDocument()
      expect(screen.getByText('At risk')).toBeInTheDocument()
    })

    it('shows "No update for 25 h" for a tracking that has been quiet for more than a day', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.getByText('No update for 25 h')).toBeInTheDocument()
    })

    it('shows how long ago a fresh tracking was updated', () => {
      renderDetail(getSeedShipment('SH-1037'))

      expect(screen.getByText('Updated 2 h ago')).toBeInTheDocument()
    })

    it('shows the final status of a delivered shipment instead of a freshness', () => {
      renderDetail(getSeedShipment('SH-1009'))

      expect(screen.getByText('Final status · no further updates')).toBeInTheDocument()
      expect(screen.getByText('Delivered', { selector: '[data-slot="badge"]' })).toBeInTheDocument()
      expect(screen.queryByText(/^Updated /)).not.toBeInTheDocument()
      expect(screen.queryByText(/^No update for/)).not.toBeInTheDocument()
    })
  })

  describe('AI summary', () => {
    it('shows the data-only summary of SH-1042 under the AI summary title', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.getByRole('heading', { name: 'AI summary' })).toBeInTheDocument()
      expect(screen.getByText(
        'Your order left Zaragoza on Oct 14. Latest update on Oct 19: it is waiting for customs clearance at Southampton port. We expect it in Birmingham on Oct 22–23 instead of Oct 20.',
      )).toBeInTheDocument()
    })

    it('states the number of carrier events as plain text, not as a button', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.getByText('Based on 6 carrier events')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /carrier events/ })).not.toBeInTheDocument()
    })

    it('summarizes the delivery of SH-1009', () => {
      renderDetail(getSeedShipment('SH-1009'))

      expect(screen.getByText(
        'Your order left Zaragoza on Oct 16 and was delivered to your Hamburg site on Oct 18 at 10:00, 1 day earlier than planned. The signed proof of delivery is ready to download.',
      )).toBeInTheDocument()
    })
  })

  describe('arrival', () => {
    it('shows the carrier ETA and our estimate with its reason while the shipment is in transit', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.getByText('Carrier ETA')).toBeInTheDocument()
      expect(screen.getByText('Source: Nordsee Line EDI · updated 12 min ago')).toBeInTheDocument()
      expect(screen.getByText('Our estimate')).toBeInTheDocument()
      expect(screen.getByText('Oct 22–23')).toBeInTheDocument()
      expect(screen.getByText(/^Why: Held by UK customs/)).toBeInTheDocument()
    })

    it('shows the delivery against the plan and no ETA once delivered', () => {
      renderDetail(getSeedShipment('SH-1009'))

      expect(screen.getByText('Oct 18 · 10:00')).toBeInTheDocument()
      expect(screen.getByText('Source: Transauto API · proof of delivery signed')).toBeInTheDocument()
      expect(screen.getByText('Planned at dispatch')).toBeInTheDocument()
      expect(screen.getByText('1 day early')).toBeInTheDocument()
      expect(screen.queryByText('Carrier ETA')).not.toBeInTheDocument()
      expect(screen.queryByText('Our estimate')).not.toBeInTheDocument()
    })
  })

  describe('journey', () => {
    it('shows the journey with the carrier names on the connectors', () => {
      renderDetail(getSeedShipment('SH-1042'))

      const journey = screen.getByRole('list', { name: 'Shipment journey' })

      expect(screen.getByRole('heading', { name: 'Journey' })).toBeInTheDocument()
      expect(within(journey).getAllByRole('listitem')).toHaveLength(4)
      expect(within(journey).getAllByText('Road · Transauto')).toHaveLength(2)
      expect(within(journey).getByText('Sea · Nordsee Line')).toBeInTheDocument()
    })

    it('offers no step to select and no hint about selecting one', () => {
      renderDetail(getSeedShipment('SH-1042'))

      const journey = screen.getByRole('list', { name: 'Shipment journey' })

      expect(within(journey).queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByText(/Click a step/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Tap a step/)).not.toBeInTheDocument()
    })
  })

  describe('documents', () => {
    it('lists the documents the customer may see with their availability', () => {
      renderDetail(getSeedShipment('SH-1042'))

      const documents = screen.getByRole('heading', { name: 'Documents' }).closest('[data-slot="card"]')
      if (!(documents instanceof HTMLElement)) {
        throw new Error('Documents card not found')
      }

      const items = within(documents).getAllByRole('listitem')
      expect(items).toHaveLength(4)
      expect(items[0]).toHaveTextContent('Commercial invoice')
      expect(within(items[0]).getByRole('button', { name: 'Download Commercial invoice' })).toBeInTheDocument()
      expect(items[2]).toHaveTextContent('Certificate of origin')
      expect(items[2]).toHaveTextContent('Pending')
      expect(items[3]).toHaveTextContent('Proof of delivery')
      expect(items[3]).toHaveTextContent('After delivery')
    })

    it('offers the signed proof of delivery for download once delivered', () => {
      renderDetail(getSeedShipment('SH-1009'))

      expect(screen.getByRole('button', { name: 'Download Proof of delivery (signed)' })).toBeInTheDocument()
    })

    it('confirms a simulated download with a toast', async () => {
      const user = userEvent.setup()
      renderDetail(getSeedShipment('SH-1009'))

      await user.click(screen.getByRole('button', { name: 'Download Proof of delivery (signed)' }))

      expect(await screen.findByText('Download started (simulated)')).toBeInTheDocument()
    })
  })

  describe('internal data', () => {
    it('shows no document check, diagnosis, draft, exception, action or file name for SH-1042', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.queryByText('Document check')).not.toBeInTheDocument()
      expect(screen.queryByText('AI diagnosis')).not.toBeInTheDocument()
      expect(screen.queryByText(/AI signal/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Exception open/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Demurrage/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Hello Nordwerk team/)).not.toBeInTheDocument()
      expect(screen.queryByText(/HS code/)).not.toBeInTheDocument()
      expect(screen.queryByText(/\.pdf/)).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Actions' })).not.toBeInTheDocument()
      expect(screen.queryByText('Packing list')).not.toBeInTheDocument()
      expect(screen.queryByText('Customs declaration')).not.toBeInTheDocument()
    })

    it('opens no source events from anywhere on the page', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.queryByRole('button', { name: /events/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('shows no proactive alert about the delay', () => {
      renderDetail(getSeedShipment('SH-1042'))

      expect(screen.queryByRole('region', { name: 'Shipment alert' })).not.toBeInTheDocument()
    })
  })
})
