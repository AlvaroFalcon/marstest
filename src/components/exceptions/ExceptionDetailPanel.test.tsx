import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { ExceptionDetailPanel } from '@/components/exceptions/ExceptionDetailPanel'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ExceptionDetailPanel', () => {
  describe('SH-1042 customs hold', () => {
    it('shows the title, the status and the exception-open badge', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      expect(await screen.findByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeInTheDocument()
      expect(screen.getByText('Customs hold')).toBeInTheDocument()
      expect(screen.getAllByText('Exception open · Oct 19')).not.toHaveLength(0)
    })

    it('shows the internal data row with customer, site, carrier and PO', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      const data = await screen.findByRole('region', { name: 'Shipment data' })

      expect(within(data).getByText('Nordwerk GmbH')).toBeInTheDocument()
      expect(within(data).getByText('Zaragoza plant')).toBeInTheDocument()
      expect(within(data).getByText('Customer PO')).toBeInTheDocument()
      expect(within(data).getByText('PO 4500-1187')).toBeInTheDocument()
      expect(within(data).getByText('Carrier')).toBeInTheDocument()
    })

    it('shows the AI diagnosis', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      expect(await screen.findByText('AI diagnosis')).toBeInTheDocument()
      expect(screen.getByText(/UK customs is holding the container at Southampton\. The certificate of origin is missing/)).toBeInTheDocument()
    })

    it('shows the freshness of the tracking and the carrier and channel of the latest event', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      expect(await screen.findByText('No update for 25 h')).toBeInTheDocument()
      expect(screen.getByText('Nordsee Line · Email')).toBeInTheDocument()
    })

    it('lists one document row per required document with the worst finding', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      const list = await screen.findByRole('list', { name: 'Documents checked against the ERP order' })
      const rows = within(list).getAllByRole('listitem')

      expect(rows).toHaveLength(5)
      expect(rows[0]).toHaveTextContent('Commercial invoice')
      expect(rows[0]).toHaveTextContent('HS code 8467.29 differs from ERP order (8467.21)')
      expect(rows[3]).toHaveTextContent('Certificate of origin')
      expect(rows[3]).toHaveTextContent('Missing · cause of the hold')
    })

    it('does not render a back link when none is given', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      await screen.findByRole('heading', { level: 1 })

      expect(screen.queryByRole('link', { name: 'Back to exceptions' })).not.toBeInTheDocument()
    })

    it('renders the back link to the given href', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" backHref="/ops/exceptions?site=bilbao-plant" />)

      const backLink = await screen.findByRole('link', { name: 'Back to exceptions' })

      expect(backLink).toHaveAttribute('href', '/ops/exceptions?site=bilbao-plant')
    })
  })

  describe('unavailable states', () => {
    it('shows the unavailable message for an unknown id', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-9999" />)

      expect(await screen.findByText('This exception isn\'t available')).toBeInTheDocument()
    })

    it('shows the same unavailable message for a shipment outside the ops scope', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1058" />)

      expect(await screen.findByText('This exception isn\'t available')).toBeInTheDocument()
    })

    it('shows the same unavailable message for a shipment without an open exception', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1001" />)

      expect(await screen.findByText('This exception isn\'t available')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    })

    it('keeps the back link in the unavailable state', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-9999" backHref="/ops/exceptions" />)

      await screen.findByText('This exception isn\'t available')

      expect(screen.getByRole('link', { name: 'Back to exceptions' })).toBeInTheDocument()
    })
  })

  describe('loading and error', () => {
    it('shows the loading status while the shipment is pending', () => {
      const api: ShipmentsApi = { ...createTestApi(), getShipment: () => new Promise(() => {}) }

      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />, { api })

      expect(screen.getByRole('status')).toHaveTextContent('Loading the exception')
    })

    it('shows an alert and recovers when "Try again" is pressed', async () => {
      const healthyApi = createTestApi()
      let shouldFail = true
      const api: ShipmentsApi = {
        ...healthyApi,
        getReferenceData: () => shouldFail
          ? Promise.reject(new Error('Network down'))
          : healthyApi.getReferenceData(),
      }
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />, { api })
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the exception')

      shouldFail = false
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

      expect(await screen.findByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeInTheDocument()
    })
  })
})
