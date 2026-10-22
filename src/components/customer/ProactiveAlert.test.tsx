import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSeed, DEMO_NOW_ISO } from '@/api/seed'
import { ProactiveAlert } from '@/components/customer/ProactiveAlert'
import type { ProactiveAlertData } from '@/lib/customerShipments'
import { buildShipmentRows, type ShipmentListRow } from '@/lib/shipmentList'
import { renderWithProviders } from '@/test/renderWithProviders'

const seed = createSeed()
const nordwerkRows = buildShipmentRows(seed.shipments, seed, new Date(DEMO_NOW_ISO), { role: 'customer', customerId: 'nordwerk' })
function findFeaturedRow(): ShipmentListRow {
  const row = nordwerkRows.find(candidate => candidate.id === 'SH-1042')
  if (row === undefined) {
    throw new Error('Missing SH-1042')
  }
  return row
}

function buildAlert(additionalCount: number): ProactiveAlertData {
  return { row: findFeaturedRow(), additionalCount }
}

describe('ProactiveAlert', () => {
  it('names the shipment and the new estimate in a generic sentence', () => {
    renderWithProviders(<ProactiveAlert alert={buildAlert(0)} customerId="nordwerk" isCompact={false} onShowMore={() => {}} />)

    const banner = screen.getByRole('region', { name: 'Shipment alert' })

    expect(banner).toHaveTextContent('SH-1042 will arrive later than planned.')
    expect(banner).toHaveTextContent('New estimate:')
  })

  it('does not include the diagnosis of the exception', () => {
    renderWithProviders(<ProactiveAlert alert={buildAlert(0)} customerId="nordwerk" isCompact={false} onShowMore={() => {}} />)

    expect(screen.getByRole('region', { name: 'Shipment alert' })).not.toHaveTextContent(/diagnos|customs hold on|certificate/i)
  })

  it('uses the shorter sentence when compact', () => {
    renderWithProviders(<ProactiveAlert alert={buildAlert(0)} customerId="nordwerk" isCompact onShowMore={() => {}} />)

    expect(screen.getByRole('region', { name: 'Shipment alert' })).toHaveTextContent('SH-1042 delayed:')
  })

  it('links to the shipment of the customer', () => {
    renderWithProviders(<ProactiveAlert alert={buildAlert(0)} customerId="nordwerk" isCompact={false} onShowMore={() => {}} />)

    expect(screen.getByRole('link', { name: 'View shipment SH-1042' })).toHaveAttribute('href', '/customers/nordwerk/shipments/SH-1042')
  })

  it('hides the more button when no other shipment alerts', () => {
    renderWithProviders(<ProactiveAlert alert={buildAlert(0)} customerId="nordwerk" isCompact={false} onShowMore={() => {}} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows +N more and calls onShowMore when it is pressed', async () => {
    const onShowMore = vi.fn()
    renderWithProviders(<ProactiveAlert alert={buildAlert(2)} customerId="nordwerk" isCompact={false} onShowMore={onShowMore} />)

    const button = screen.getByRole('button', { name: 'Show 2 more shipments that need attention' })
    await userEvent.click(button)

    expect(button).toHaveTextContent('+2 more')
    expect(onShowMore).toHaveBeenCalledTimes(1)
  })
})
