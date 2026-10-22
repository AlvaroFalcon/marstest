import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShipmentActions, type ShipmentActionsProps } from '@/components/shipments/ShipmentActions'
import { Toaster } from '@/components/ui/sonner'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderActions(model: ShipmentActionsProps['model']) {
  return renderWithProviders(
    <>
      <ShipmentActions model={model} carrierName="EuroRuta" customerName="Alpen Werkzeug AG" inboxHref="/ops/exceptions/SH-1035" />
      <Toaster />
    </>,
  )
}

describe('ShipmentActions', () => {
  it('shows the note and the actions in the order given', () => {
    renderActions({ note: 'nothingNeeded', actions: ['contactCarrier', 'messageCustomer', 'copyTrackingLink'] })

    expect(screen.getByRole('heading', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByText('Nothing needs your attention.')).toBeInTheDocument()
    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual([
      'Contact carrier (EuroRuta)',
      'Message customer',
      'Copy customer tracking link',
    ])
  })

  it('confirms a message to the customer with a simulated toast naming them', async () => {
    renderActions({ note: 'nothingNeeded', actions: ['messageCustomer'] })

    await userEvent.click(screen.getByRole('button', { name: 'Message customer' }))

    expect(await screen.findByText('Message to Alpen Werkzeug AG sent (simulated)')).toBeInTheDocument()
  })

  it('confirms asking the carrier to confirm the ETA with a simulated toast naming the carrier', async () => {
    renderActions({ note: 'watchingLowConfidence', actions: ['askCarrierToConfirm'] })

    await userEvent.click(screen.getByRole('button', { name: 'Ask EuroRuta to confirm ETA (AI draft)' }))

    expect(await screen.findByText('ETA confirmation requested from EuroRuta (simulated)')).toBeInTheDocument()
  })

  it('renders the draft review and the inbox actions as links to the exception', () => {
    renderActions({ note: 'exceptionWithDraft', actions: ['reviewDraft', 'askNewSlot', 'openInbox'] })

    expect(screen.getByRole('link', { name: 'Review AI draft to customer' })).toHaveAttribute('href', '/ops/exceptions/SH-1035')
    expect(screen.getByRole('link', { name: 'Open in exceptions inbox' })).toHaveAttribute('href', '/ops/exceptions/SH-1035')
    expect(screen.getByRole('button', { name: 'Ask EuroRuta for a new delivery slot' })).toBeInTheDocument()
  })

  it('words the threshold in the watching note', () => {
    renderActions({ note: 'watchingLowConfidence', actions: [] })

    expect(screen.getByText('Not alerting the customer yet (confidence below 75%).')).toBeInTheDocument()
  })
})
