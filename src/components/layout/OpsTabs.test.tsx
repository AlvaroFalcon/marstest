import { screen } from '@testing-library/react'
import { OpsTabs, type OpsTabsProps } from '@/components/layout/OpsTabs'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderTabs(props: Partial<OpsTabsProps> = {}) {
  return renderWithProviders(
    <OpsTabs
      exceptionsHref="/ops/exceptions"
      shipmentsHref="/ops/shipments"
      active="exceptions"
      exceptionCount={{ status: 'ready', value: 5 }}
      shipmentCount={{ status: 'ready', value: 16 }}
      {...props}
    />,
  )
}

describe('OpsTabs', () => {
  it('links the two tabs to their ops routes', () => {
    renderTabs()

    expect(screen.getByRole('link', { name: /^Exceptions/ })).toHaveAttribute('href', '/ops/exceptions')
    expect(screen.getByRole('link', { name: /^All shipments/ })).toHaveAttribute('href', '/ops/shipments')
  })

  it('shows both counts inside the tab names', () => {
    renderTabs()

    expect(screen.getByRole('link', { name: /^Exceptions\s*5$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^All shipments\s*16$/ })).toBeInTheDocument()
  })

  it('marks only the exceptions tab as current when it is active', () => {
    renderTabs({ active: 'exceptions' })

    expect(screen.getByRole('link', { name: /^Exceptions/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^All shipments/ })).not.toHaveAttribute('aria-current')
  })

  it('marks only the all-shipments tab as current when it is active', () => {
    renderTabs({ active: 'shipments' })

    expect(screen.getByRole('link', { name: /^All shipments/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /^Exceptions/ })).not.toHaveAttribute('aria-current')
  })

  it('shows a loading placeholder instead of a number while counts load', () => {
    renderTabs({ exceptionCount: { status: 'loading' }, shipmentCount: { status: 'loading' } })

    expect(screen.getAllByText('Loading count')).toHaveLength(2)
    expect(screen.queryByText('5')).not.toBeInTheDocument()
    expect(screen.queryByText('16')).not.toBeInTheDocument()
  })

  it('shows no count and no placeholder when a count failed to load', () => {
    renderTabs({ exceptionCount: { status: 'error' }, shipmentCount: { status: 'ready', value: 16 } })

    expect(screen.getByRole('link', { name: 'Exceptions' })).toBeInTheDocument()
    expect(screen.queryByText('Loading count')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^All shipments\s*16$/ })).toBeInTheDocument()
  })
})
