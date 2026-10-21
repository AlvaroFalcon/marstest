import { screen } from '@testing-library/react'
import { ExceptionStatusBadge } from '@/components/exceptions/ExceptionStatusBadge'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('ExceptionStatusBadge', () => {
  it('shows "Customs hold" for a customs hold', () => {
    renderWithProviders(<ExceptionStatusBadge status={{ type: 'customsHold' }} />)

    expect(screen.getByText('Customs hold')).toBeInTheDocument()
  })

  it('shows "Incident" for an incident', () => {
    renderWithProviders(<ExceptionStatusBadge status={{ type: 'incident' }} />)

    expect(screen.getByText('Incident')).toBeInTheDocument()
  })

  it('shows "Delayed" for a rolled vessel', () => {
    renderWithProviders(<ExceptionStatusBadge status={{ type: 'vesselRolled' }} />)

    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('shows "Delay predicted" for a predicted delay', () => {
    renderWithProviders(<ExceptionStatusBadge status={{ type: 'predictedDelay' }} />)

    expect(screen.getByText('Delay predicted')).toBeInTheDocument()
  })

  it('shows the hours without news for stale tracking', () => {
    renderWithProviders(<ExceptionStatusBadge status={{ type: 'staleTracking', staleHours: 48 }} />)

    expect(screen.getByText('No update 48 h')).toBeInTheDocument()
  })
})
