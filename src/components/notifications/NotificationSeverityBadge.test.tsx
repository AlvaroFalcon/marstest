import { screen } from '@testing-library/react'
import { NotificationSeverityBadge } from '@/components/notifications/NotificationSeverityBadge'
import type { NotificationSeverity } from '@/lib/notifications'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderBadge(severity: NotificationSeverity) {
  return renderWithProviders(<NotificationSeverityBadge severity={severity} />)
}

describe('NotificationSeverityBadge', () => {
  it('shows the inbox badge of a vessel-rolled exception', () => {
    renderBadge({ kind: 'exception', exceptionType: 'vesselRolled' })

    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('shows the inbox badge of a predicted-delay exception', () => {
    renderBadge({ kind: 'exception', exceptionType: 'predictedDelay' })

    expect(screen.getByText('Delay predicted')).toBeInTheDocument()
  })

  it('shows "No update" without hours for a stale-tracking exception', () => {
    renderBadge({ kind: 'exception', exceptionType: 'staleTracking' })

    expect(screen.getByText('No update')).toBeInTheDocument()
    expect(screen.queryByText(/\d+ h/)).not.toBeInTheDocument()
  })

  it.each([
    ['resolved', 'Resolved'],
    ['backOnTrack', 'Back on track'],
    ['atRisk', 'At risk'],
    ['delivered', 'Delivered'],
    ['update', 'Update'],
  ] as const)('shows "%s" as "%s" with a decorative icon', (kind, label) => {
    const { container } = renderBadge({ kind })

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })
})
