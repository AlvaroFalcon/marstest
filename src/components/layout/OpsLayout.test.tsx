import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { OpsLayout } from '@/components/layout/OpsLayout'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderOpsLayout(api: ShipmentsApi, initialPath = '/ops/exceptions') {
  return renderWithProviders(
    <Routes>
      <Route element={<OpsLayout />}>
        <Route path="/ops/exceptions" element={<p>Exceptions page</p>} />
        <Route path="/ops/shipments" element={<p>Shipments page</p>} />
      </Route>
    </Routes>,
    { api, initialPath },
  )
}

describe('OpsLayout', () => {
  it('shows the open exceptions of the ops scope and the shipments of the ops scope', async () => {
    renderOpsLayout(createTestApi())

    expect(await screen.findByRole('link', { name: /^Exceptions\s*5$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^All shipments\s*16$/ })).toBeInTheDocument()
  })

  it('renders the page below the tabs', async () => {
    renderOpsLayout(createTestApi(), '/ops/shipments')

    expect(await screen.findByText('Shipments page')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^All shipments/ })).toHaveAttribute('aria-current', 'page')
  })

  it('shows a loading placeholder while the counts are pending', () => {
    const neverResolves = new Promise<never>(() => {})
    const api: ShipmentsApi = {
      ...createTestApi(),
      listExceptions: () => neverResolves,
      listShipments: () => neverResolves,
    }

    renderOpsLayout(api)

    expect(screen.getAllByText('Loading count')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /^Exceptions/ })).toBeInTheDocument()
  })

  it('shows no number for the exceptions tab when its request fails', async () => {
    const api: ShipmentsApi = {
      ...createTestApi(),
      listExceptions: () => Promise.reject(new Error('Network down')),
    }

    renderOpsLayout(api)

    expect(await screen.findByRole('link', { name: /^All shipments\s*16$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Exceptions' })).toBeInTheDocument()
    expect(screen.queryByText('Loading count')).not.toBeInTheDocument()
  })

  it('shows no number for either tab when the reference data fails to load', async () => {
    const api: ShipmentsApi = {
      ...createTestApi(),
      getReferenceData: () => Promise.reject(new Error('Network down')),
    }

    renderOpsLayout(api)

    expect(await screen.findByRole('link', { name: 'Exceptions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All shipments' })).toBeInTheDocument()
  })
})
