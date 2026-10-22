import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerDocuments } from '@/components/customer/CustomerDocuments'
import { Toaster } from '@/components/ui/sonner'
import type { CustomerDocumentRow } from '@/lib/customerDocuments'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderDocuments(rows: CustomerDocumentRow[]) {
  return renderWithProviders(
    <>
      <CustomerDocuments rows={rows} />
      <Toaster />
    </>,
  )
}

function getRow(name: string): HTMLElement {
  const match = screen.getAllByRole('listitem').find(item => within(item).queryByText(name) !== null)
  if (!match) {
    throw new Error(`Document row ${name} not found`)
  }
  return match
}

describe('CustomerDocuments', () => {
  describe('rows', () => {
    it('shows the heading and one row per document in the given order', () => {
      renderDocuments([
        { documentType: 'commercialInvoice', availability: { kind: 'download', documentId: 'SH-1042-commercialInvoice' } },
        { documentType: 'billOfLading', availability: { kind: 'download', documentId: 'SH-1042-billOfLading' } },
        { documentType: 'certificateOfOrigin', availability: { kind: 'pending' } },
        { documentType: 'proofOfDelivery', availability: { kind: 'afterDelivery' } },
      ])

      expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(4)
      expect(items[0]).toHaveTextContent('Commercial invoice')
      expect(items[1]).toHaveTextContent('Bill of lading')
      expect(items[2]).toHaveTextContent('Certificate of origin')
      expect(items[3]).toHaveTextContent('Proof of delivery')
    })

    it('shows "No documents yet" and no list when there are no rows', () => {
      renderDocuments([])

      expect(screen.getByText('No documents yet')).toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('exposes the full CMR name and keeps the short one out of the accessibility tree', () => {
      renderDocuments([{ documentType: 'cmr', availability: { kind: 'pending' } }])

      expect(screen.getByText('CMR (road consignment note)')).toBeInTheDocument()
      expect(screen.getByText('CMR', { ignore: 'script, style' })).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('availability', () => {
    it('shows a download button named after the document for a received one', () => {
      renderDocuments([{ documentType: 'commercialInvoice', availability: { kind: 'download', documentId: 'SH-1042-commercialInvoice' } }])

      expect(screen.getByRole('button', { name: 'Download Commercial invoice' })).toBeVisible()
    })

    it('shows "Pending" and no button for a document that is not available yet', () => {
      renderDocuments([{ documentType: 'certificateOfOrigin', availability: { kind: 'pending' } }])

      const row = getRow('Certificate of origin')

      expect(within(row).getByText('Pending')).toBeInTheDocument()
      expect(within(row).queryByRole('button')).not.toBeInTheDocument()
    })

    it('shows "After delivery" and no button for the proof of delivery of a shipment in transit', () => {
      renderDocuments([{ documentType: 'proofOfDelivery', availability: { kind: 'afterDelivery' } }])

      const row = getRow('Proof of delivery')

      expect(within(row).getByText('After delivery')).toBeInTheDocument()
      expect(within(row).queryByRole('button')).not.toBeInTheDocument()
    })

    it('names a downloadable proof of delivery "Proof of delivery (signed)"', () => {
      renderDocuments([{ documentType: 'proofOfDelivery', availability: { kind: 'download', documentId: 'SH-1009-proofOfDelivery' } }])

      expect(screen.getByText('Proof of delivery (signed)')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download Proof of delivery (signed)' })).toBeVisible()
    })

    it('shows "Pending" for a delivered shipment whose proof of delivery has not arrived', () => {
      renderDocuments([{ documentType: 'proofOfDelivery', availability: { kind: 'pending' } }])

      const row = getRow('Proof of delivery')

      expect(within(row).getByText('Pending')).toBeInTheDocument()
      expect(screen.queryByText('Proof of delivery (signed)')).not.toBeInTheDocument()
    })
  })

  describe('download', () => {
    it('confirms the simulated download with a toast', async () => {
      const user = userEvent.setup()
      renderDocuments([{ documentType: 'billOfLading', availability: { kind: 'download', documentId: 'SH-1042-billOfLading' } }])

      await user.click(screen.getByRole('button', { name: 'Download Bill of lading' }))

      expect(await screen.findByText('Download started (simulated)')).toBeInTheDocument()
    })

    it('shows no toast before any download is requested', () => {
      renderDocuments([{ documentType: 'billOfLading', availability: { kind: 'download', documentId: 'SH-1042-billOfLading' } }])

      expect(screen.queryByText('Download started (simulated)')).not.toBeInTheDocument()
    })
  })
})
