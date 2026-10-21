import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { CustomerShipmentsPage } from '@/pages/customers/CustomerShipmentsPage'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderPageAt(initialPath: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <Routes>
      <Route path="/customers/:customerId/shipments" element={<CustomerShipmentsPage />} />
    </Routes>,
    { initialPath, api },
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

  it('shows a loading placeholder instead of "Page not found" while the customers load', () => {
    const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => new Promise(() => {}) }

    renderPageAt('/customers/nordwerk/shipments', api)

    expect(screen.getByRole('heading', { name: 'Your shipments' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a load error instead of "Page not found" when the reference data fails', async () => {
    const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => Promise.reject(new Error('Network down')) }

    renderPageAt('/customers/nordwerk/shipments', api)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this page. Try again later.')
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})
