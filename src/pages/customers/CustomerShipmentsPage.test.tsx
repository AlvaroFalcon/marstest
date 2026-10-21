import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { CustomerShipmentsPage } from '@/pages/customers/CustomerShipmentsPage'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderPageAt(initialPath: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/customers/:customerId/shipments" element={<CustomerShipmentsPage />} />
    </Routes>,
    { initialPath },
  )
}

describe('CustomerShipmentsPage', () => {
  it('shows the name of the customer in the URL', async () => {
    renderPageAt('/customers/alpen-werkzeug/shipments')

    expect(await screen.findByText('Alpen Werkzeug AG')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your shipments' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('shows "Page not found" for a customer id that does not exist', async () => {
    renderPageAt('/customers/unknown-co/shipments')

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your shipments' })).not.toBeInTheDocument()
  })
})
