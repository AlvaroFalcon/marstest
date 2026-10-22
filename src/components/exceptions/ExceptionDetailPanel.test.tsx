import { screen, waitFor, within } from '@testing-library/react'
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

  describe('source events sheet', () => {
    it('opens from the "Based on" evidence button with every event of the shipment', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      await userEvent.click(await screen.findByRole('button', { name: /Based on 2 events/ }))

      const dialog = await screen.findByRole('dialog', { name: 'Source events · SH-1042' })
      const list = within(dialog).getByRole('list', { name: 'Carrier events, oldest first' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(6)
      expect(within(dialog).getByText('PICKUP CONFIRMED ZARAGOZA PLANT')).toBeInTheDocument()
      expect(within(dialog).getByText('Mapped by AI · 91% confidence')).toBeInTheDocument()
      expect(within(dialog).getAllByText('Cited by diagnosis')).toHaveLength(2)
      expect(within(dialog).getByText('+3 d 18 h')).toBeInTheDocument()
      expect(within(dialog).getByText('+4 h 15 min')).toBeInTheDocument()
    })

    it('does not highlight any event when opened from the evidence button', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)

      await userEvent.click(await screen.findByRole('button', { name: /Based on 2 events/ }))

      await screen.findByRole('dialog')
      expect(screen.queryByText('Selected journey step')).not.toBeInTheDocument()
    })

    it('closes with Escape and returns focus to the evidence button', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)
      const trigger = await screen.findByRole('button', { name: /Based on 2 events/ })
      await userEvent.click(trigger)
      await screen.findByRole('dialog')

      await userEvent.keyboard('{Escape}')

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await waitFor(() => expect(trigger).toHaveFocus())
    })

    it('opens from a journey step and highlights only that step\'s events', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)
      const journey = await screen.findByRole('list', { name: 'Shipment journey' })

      await userEvent.click(within(journey).getByRole('button', { name: /Bilbao port/ }))

      const dialog = await screen.findByRole('dialog', { name: 'Source events · SH-1042' })
      const events = within(within(dialog).getByRole('list', { name: 'Carrier events, oldest first' })).getAllByRole('listitem')
      expect(events.map(event => event.getAttribute('aria-current'))).toEqual([null, 'true', 'true', 'true', null, null])
      expect(within(dialog).getAllByText('Selected journey step')).toHaveLength(3)
    })

    it('returns focus to the journey step button when closed with Escape', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)
      const journey = await screen.findByRole('list', { name: 'Shipment journey' })
      const stepButton = within(journey).getByRole('button', { name: /Southampton port/ })
      await userEvent.click(stepButton)
      await screen.findByRole('dialog')

      await userEvent.keyboard('{Escape}')

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await waitFor(() => expect(stepButton).toHaveFocus())
    })

    it('clears the highlight when the sheet is reopened from the evidence button', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />)
      const journey = await screen.findByRole('list', { name: 'Shipment journey' })
      await userEvent.click(within(journey).getByRole('button', { name: /Bilbao port/ }))
      await screen.findByRole('dialog')
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      await userEvent.click(screen.getByRole('button', { name: /Based on 2 events/ }))

      await screen.findByRole('dialog')
      expect(screen.queryByText('Selected journey step')).not.toBeInTheDocument()
    })

    it('opens on load with ?events=open and moves focus to the title after Escape', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />, { initialPath: '/ops/exceptions/SH-1042?events=open' })

      expect(await screen.findByRole('dialog', { name: 'Source events · SH-1042' })).toBeInTheDocument()
      await userEvent.keyboard('{Escape}')

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(screen.getByRole('heading', { level: 1, name: /^SH-1042/ })).toHaveFocus()
    })

    it('stays closed when events has an invalid value', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1042" />, { initialPath: '/ops/exceptions/SH-1042?events=banana' })

      await screen.findByRole('heading', { level: 1, name: /^SH-1042/ })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('flags the low-confidence AI event of SH-1029 for review', async () => {
      renderWithProviders(<ExceptionDetailPanel shipmentId="SH-1029" />)

      await userEvent.click(await screen.findByRole('button', { name: /Based on 1 event/ }))

      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText('AI 54% · below threshold, needs human review')).toBeInTheDocument()
      expect(within(dialog).getByText('In transit?')).toBeInTheDocument()
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
