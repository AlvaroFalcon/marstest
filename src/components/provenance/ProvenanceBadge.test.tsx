import { screen } from '@testing-library/react'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ProvenanceBadge', () => {
  it('shows the carrier ETA label', () => {
    renderWithProviders(<ProvenanceBadge kind={{ type: 'carrierEta' }} />)

    expect(screen.getByText('Carrier ETA')).toBeInTheDocument()
  })

  it('shows the word Estimated and the confidence for an estimate', () => {
    renderWithProviders(<ProvenanceBadge kind={{ type: 'estimated', confidence: 78 }} />)

    expect(screen.getByText('Estimated · 78%')).toBeInTheDocument()
  })

  it('shows only the percentage for a compact estimate and keeps Estimated for screen readers', () => {
    renderWithProviders(<ProvenanceBadge kind={{ type: 'estimated', confidence: 94, compact: true }} />)

    expect(screen.getByText('94%', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Estimated')).toHaveClass('sr-only')
    expect(screen.queryByText('Estimated · 94%')).not.toBeInTheDocument()
  })

  it('shows the derived from GPS label', () => {
    renderWithProviders(<ProvenanceBadge kind={{ type: 'derivedFromGps' }} />)

    expect(screen.getByText('Derived from GPS')).toBeInTheDocument()
  })

  it('shows how many hours there has been no update', () => {
    renderWithProviders(<ProvenanceBadge kind={{ type: 'noUpdate', hours: 48 }} />)

    expect(screen.getByText('No update for 48 h')).toBeInTheDocument()
  })
})
