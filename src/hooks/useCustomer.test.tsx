import { screen } from '@testing-library/react'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { useCustomer } from '@/hooks/useCustomer'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function CustomerProbe({ customerId }: { customerId: string | undefined }) {
  const lookup = useCustomer(customerId)

  return (
    <output aria-label="Lookup">
      {lookup.status === 'found' ? `found:${lookup.customer.name}` : lookup.status}
    </output>
  )
}

describe('useCustomer', () => {
  it('reports loading while the reference data is pending', () => {
    const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => new Promise(() => {}) }

    renderWithProviders(<CustomerProbe customerId="nordwerk" />, { api })

    expect(screen.getByLabelText('Lookup')).toHaveTextContent('loading')
  })

  it('reports the customer when the id exists', async () => {
    renderWithProviders(<CustomerProbe customerId="nordwerk" />)

    expect(await screen.findByText('found:Nordwerk GmbH')).toBeInTheDocument()
  })

  it('reports notFound when the id matches no customer', async () => {
    renderWithProviders(<CustomerProbe customerId="unknown-co" />)

    expect(await screen.findByText('notFound')).toBeInTheDocument()
  })

  it('reports notFound when there is no id', async () => {
    renderWithProviders(<CustomerProbe customerId={undefined} />)

    expect(await screen.findByText('notFound')).toBeInTheDocument()
  })

  it('reports error when the reference data fails to load', async () => {
    const api: ShipmentsApi = { ...createTestApi(), getReferenceData: () => Promise.reject(new Error('Network down')) }

    renderWithProviders(<CustomerProbe customerId="nordwerk" />, { api })

    expect(await screen.findByText('error')).toBeInTheDocument()
  })
})
