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
  it('shows the heading and the first page of shipments with the footer count', async () => {
    renderWithProviders(<OpsShipmentsPage />)

    expect(screen.getByRole('heading', { name: 'All shipments' })).toBeInTheDocument()
    expect(await screen.findByText('Showing 8 of 16')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /SH-1029/ })).toHaveAttribute('href', '/ops/shipments/SH-1029')
  })
})
