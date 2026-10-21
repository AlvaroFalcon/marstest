import { screen } from '@testing-library/react'
import { FreshnessIndicator } from '@/components/provenance/FreshnessIndicator'
import { renderWithProviders } from '@/test/renderWithProviders'

const now = new Date('2026-10-20T10:00:00Z')

describe('FreshnessIndicator', () => {
  it('shows how long ago the data was updated in hours', () => {
    renderWithProviders(
      <FreshnessIndicator freshness={{ kind: 'fresh', lastUpdateAt: '2026-10-20T08:00:00Z', hoursSinceUpdate: 2 }} now={now} />,
    )

    expect(screen.getByText('Updated 2 h ago')).toBeInTheDocument()
  })

  it('shows minutes when the data was updated less than an hour ago', () => {
    renderWithProviders(
      <FreshnessIndicator freshness={{ kind: 'fresh', lastUpdateAt: '2026-10-20T09:48:00Z', hoursSinceUpdate: 0.2 }} now={now} />,
    )

    expect(screen.getByText('Updated 12 min ago')).toBeInTheDocument()
  })

  it('shows the hours without news when the data is stale', () => {
    renderWithProviders(
      <FreshnessIndicator freshness={{ kind: 'stale', lastUpdateAt: '2026-10-18T09:30:00Z', hoursSinceUpdate: 48.5 }} now={now} />,
    )

    expect(screen.getByText('No update for 48 h')).toBeInTheDocument()
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument()
  })

  it('renders nothing for a delivered shipment', () => {
    renderWithProviders(<FreshnessIndicator freshness={{ kind: 'notApplicable' }} now={now} />)

    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument()
    expect(screen.queryByText(/No update/)).not.toBeInTheDocument()
  })
})
