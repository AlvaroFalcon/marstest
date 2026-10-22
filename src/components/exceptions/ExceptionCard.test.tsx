import { screen } from '@testing-library/react'
import { ExceptionCard, type ExceptionCardProps } from '@/components/exceptions/ExceptionCard'
import { renderWithProviders } from '@/test/renderWithProviders'

function buildProps(overrides: Partial<ExceptionCardProps> = {}): ExceptionCardProps {
  return {
    shipmentId: 'SH-1042',
    route: 'Zaragoza → Birmingham',
    reason: 'UK customs is holding the container at Southampton.',
    status: { type: 'customsHold' },
    href: '/ops/exceptions/SH-1042?site=zaragoza-plant',
    isOpen: false,
    isCustomerNotified: false,
    isNew: false,
    ...overrides,
  }
}

describe('ExceptionCard', () => {
  it('shows the shipment, route, reason and status badge in one link', () => {
    renderWithProviders(<ExceptionCard {...buildProps()} />)

    const card = screen.getByRole('link', {
      name: /SH-1042 · Zaragoza → Birmingham.*UK customs is holding the container at Southampton\..*Customs hold/,
    })
    expect(card).toBeInTheDocument()
  })

  it('links to the detail URL it was given', () => {
    renderWithProviders(<ExceptionCard {...buildProps()} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/ops/exceptions/SH-1042?site=zaragoza-plant')
  })

  it('shows the hours without news for a stale tracking exception', () => {
    renderWithProviders(
      <ExceptionCard {...buildProps({ shipmentId: 'SH-1029', status: { type: 'staleTracking', staleHours: 52 } })} />,
    )

    expect(screen.getByText('No update 52 h')).toBeInTheDocument()
  })

  it('shows a New badge only when the exception is new', () => {
    renderWithProviders(<ExceptionCard {...buildProps({ isNew: true })} />)

    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('shows no New badge by default', () => {
    renderWithProviders(<ExceptionCard {...buildProps()} />)

    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  it('marks the open card as the current page', () => {
    renderWithProviders(<ExceptionCard {...buildProps({ isOpen: true })} />)

    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark a closed card as the current page', () => {
    renderWithProviders(<ExceptionCard {...buildProps({ isOpen: false })} />)

    expect(screen.getByRole('link')).not.toHaveAttribute('aria-current')
  })

  it('shows the "Customer notified" badge when the notice was sent', () => {
    renderWithProviders(<ExceptionCard {...buildProps({ isCustomerNotified: true })} />)

    expect(screen.getByRole('link')).toHaveTextContent('Customer notified')
  })

  it('does not show the "Customer notified" badge while the notice was not sent', () => {
    renderWithProviders(<ExceptionCard {...buildProps({ isCustomerNotified: false })} />)

    expect(screen.queryByText('Customer notified')).not.toBeInTheDocument()
  })
})
