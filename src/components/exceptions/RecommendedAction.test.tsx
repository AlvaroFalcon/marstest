import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConflictError, type ShipmentsApi } from '@/api/shipmentsApi'
import { ExceptionDetailPanel } from '@/components/exceptions/ExceptionDetailPanel'
import { Toaster } from '@/components/ui/sonner'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderPanel(shipmentId: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <>
      <ExceptionDetailPanel shipmentId={shipmentId} />
      <Toaster />
    </>,
    { api },
  )
}

async function findMessageField() {
  return screen.findByRole('textbox', { name: 'Message to customer' })
}

describe('RecommendedAction', () => {
  describe('pending draft', () => {
    it('shows the AI draft in an editable field with the approval note', async () => {
      renderPanel('SH-1042')

      const field = await findMessageField()

      expect(field).toHaveValue('Hello Nordwerk team, your shipment SH-1042 (PO 4500-1187) is held by UK customs at Southampton because a document is missing. We are providing it today and now expect delivery about two days later than planned. We will update you as soon as the container is released.')
      expect(field).toBeEnabled()
      expect(screen.getByText('Nothing is sent without your approval.')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Recommended action' })).toBeInTheDocument()
    })

    it('keeps the text the user types', async () => {
      renderPanel('SH-1042')
      const field = await findMessageField()

      await userEvent.clear(field)
      await userEvent.type(field, 'Hello John')

      expect(field).toHaveValue('Hello John')
    })

    it('disables approve and shows a hint when the message is empty', async () => {
      renderPanel('SH-1042')
      const field = await findMessageField()

      await userEvent.clear(field)

      expect(screen.getByRole('button', { name: 'Approve and send' })).toBeDisabled()
      expect(screen.getByText('Write a message to send')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Discard' })).toBeEnabled()
    })

    it('disables approve when the message has only blanks', async () => {
      renderPanel('SH-1042')
      const field = await findMessageField()

      await userEvent.clear(field)
      await userEvent.type(field, '   ')

      expect(screen.getByRole('button', { name: 'Approve and send' })).toBeDisabled()
    })
  })

  describe('approve and send', () => {
    it('shows the success toast naming the customer', async () => {
      renderPanel('SH-1042')
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      expect(await screen.findByText('Notice sent to Nordwerk GmbH')).toBeInTheDocument()
    })

    it('locks the draft as plain text and shows "Customer notified"', async () => {
      renderPanel('SH-1042')
      const field = await findMessageField()
      await userEvent.clear(field)
      await userEvent.type(field, 'Hello John, we expect a delay.')

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      expect(await screen.findByText('Customer notified · 0 min ago')).toBeInTheDocument()
      expect(screen.getByText('Hello John, we expect a delay.')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Approve and send' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument()
    })

    it('moves focus to the "Customer notified" line', async () => {
      renderPanel('SH-1042')
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      const line = await screen.findByText('Customer notified · 0 min ago')
      await waitFor(() => expect(line).toHaveFocus())
    })

    it('shows an inline alert and keeps the typed text when sending fails', async () => {
      const api: ShipmentsApi = { ...createTestApi(), approveDraft: () => Promise.reject(new Error('Network down')) }
      renderPanel('SH-1042', api)
      const field = await findMessageField()
      await userEvent.clear(field)
      await userEvent.type(field, 'Hello John')

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Couldn\'t send the notice. Your text is kept, try again.')
      expect(screen.getByRole('textbox', { name: 'Message to customer' })).toHaveValue('Hello John')
      expect(screen.getByRole('button', { name: 'Approve and send' })).toBeEnabled()
    })

    it('locks both buttons while the request is in flight', async () => {
      const api: ShipmentsApi = { ...createTestApi(), approveDraft: () => new Promise(() => {}) }
      renderPanel('SH-1042', api)
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      expect(await screen.findByRole('button', { name: 'Sending…' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled()
    })

    it('shows the conflict toast and the latest version when the draft was already handled', async () => {
      const healthyApi = createTestApi()
      const api: ShipmentsApi = {
        ...healthyApi,
        approveDraft: async (shipmentId, exceptionId) => {
          await healthyApi.discardDraft(shipmentId, exceptionId)
          throw new ConflictError('Already handled')
        },
      }
      renderPanel('SH-1042', api)
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      expect(await screen.findByText('This notice was already handled. The latest version is shown.')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Message to customer' })).not.toBeInTheDocument())
    })
  })

  describe('discard', () => {
    it('removes the draft and shows the discard toast', async () => {
      renderPanel('SH-1042')
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

      expect(await screen.findByText('Draft discarded')).toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: 'Message to customer' })).not.toBeInTheDocument()
      expect(screen.queryByText('Nothing is sent without your approval.')).not.toBeInTheDocument()
      expect(screen.queryByText(/Customer notified/)).not.toBeInTheDocument()
    })

    it('keeps the section with the other actions and focuses its heading on SH-1042', async () => {
      renderPanel('SH-1042')
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

      const heading = await screen.findByRole('heading', { level: 2, name: 'Recommended action' })
      await waitFor(() => expect(heading).toHaveFocus())
      expect(screen.getByRole('button', { name: 'Upload certificate of origin' })).toBeInTheDocument()
    })

    it('removes the whole section and focuses the page title on SH-1037', async () => {
      renderPanel('SH-1037')
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

      await waitFor(() => expect(screen.queryByRole('heading', { level: 2, name: 'Recommended action' })).not.toBeInTheDocument())
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
    })

    it('shows an inline alert and keeps the draft when discarding fails', async () => {
      const api: ShipmentsApi = { ...createTestApi(), discardDraft: () => Promise.reject(new Error('Network down')) }
      renderPanel('SH-1042', api)
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Discard' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Couldn\'t discard the draft. Try again.')
      expect(screen.getByRole('textbox', { name: 'Message to customer' })).toBeInTheDocument()
    })
  })

  describe('other actions', () => {
    it('shows the simulated upload feedback on SH-1042', async () => {
      renderPanel('SH-1042')

      await userEvent.click(await screen.findByRole('button', { name: 'Upload certificate of origin' }))

      expect(await screen.findByText('Certificate of origin upload simulated')).toBeInTheDocument()
    })

    it('shows the simulated Chamber of Commerce request feedback on SH-1042', async () => {
      renderPanel('SH-1042')

      await userEvent.click(await screen.findByRole('button', { name: 'Request it from Chamber of Commerce' }))

      expect(await screen.findByText('Request sent to Chamber of Commerce (simulated)')).toBeInTheDocument()
    })

    it('keeps the other actions after the notice was sent', async () => {
      renderPanel('SH-1042')
      await findMessageField()

      await userEvent.click(screen.getByRole('button', { name: 'Approve and send' }))

      await screen.findByText('Customer notified · 0 min ago')
      expect(screen.getByRole('button', { name: 'Upload certificate of origin' })).toBeInTheDocument()
    })

    it('does not offer the certificate actions on a shipment without a missing certificate', async () => {
      renderPanel('SH-1037')

      await findMessageField()

      expect(screen.queryByRole('button', { name: 'Upload certificate of origin' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Request it from Chamber of Commerce' })).not.toBeInTheDocument()
    })
  })

  describe('no draft', () => {
    it('renders no recommended action for a stale tracking exception', async () => {
      renderPanel('SH-1029')

      await screen.findByRole('heading', { level: 1 })

      expect(screen.queryByRole('heading', { name: 'Recommended action' })).not.toBeInTheDocument()
    })
  })
})
