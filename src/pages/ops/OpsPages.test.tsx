import { screen } from '@testing-library/react'
import { OpsExceptionsPage } from '@/pages/ops/OpsExceptionsPage'
import { OpsShipmentsPage } from '@/pages/ops/OpsShipmentsPage'
import { renderWithProviders } from '@/test/renderWithProviders'

describe('OpsExceptionsPage', () => {
  it('shows the inbox heading', () => {
    renderWithProviders(<OpsExceptionsPage />)

    expect(screen.getByRole('heading', { name: /Exceptions/ })).toBeInTheDocument()
  })
})

describe('OpsShipmentsPage', () => {
  it('shows the all-shipments heading with a coming soon note', () => {
    renderWithProviders(<OpsShipmentsPage />)

    expect(screen.getByRole('heading', { name: 'All shipments' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })
})
