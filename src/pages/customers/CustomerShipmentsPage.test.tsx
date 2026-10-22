import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { CustomerShipmentsPage } from '@/pages/customers/CustomerShipmentsPage'
import { createTestApi } from '@/test/createTestApi'
import { mockMatchMedia, type MockMatchMedia } from '@/test/mockMatchMedia'
import { renderWithProviders } from '@/test/renderWithProviders'

function LocationProbe() {
  const location = useLocation()

  return <output aria-label="Current URL">{location.pathname + location.search}</output>
}

function renderPageAt(initialPath: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/customers/:customerId/shipments" element={<CustomerShipmentsPage />} />
        <Route path="/customers/:customerId/shipments/:shipmentId" element={<CustomerShipmentsPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { initialPath, api },
  )
}

function getCurrentUrl() {
  return screen.getByLabelText('Current URL').textContent
}

function getTableIds() {
  const rows = within(screen.getByRole('table', { name: 'Shipments' })).getAllByRole('row').slice(1)

  return rows.map(row => within(row).getAllByRole('link')[0].textContent)
}

function getCardIds() {
  return within(screen.getByRole('list', { name: 'Shipments' }))
    .getAllByRole('link')
    .map(link => link.textContent?.slice(0, 7))
}

describe('CustomerShipmentsPage', () => {
  let mediaQuery: MockMatchMedia | null = null

  afterEach(() => {
    mediaQuery?.restore()
    mediaQuery = null
  })

  describe('loading and errors', () => {
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
    })

    it('shows an error with the heading kept when the shipments fail to load', async () => {
      mediaQuery = mockMatchMedia(true)
      const api: ShipmentsApi = { ...createTestApi(), listShipments: () => Promise.reject(new Error('Network down')) }

      renderPageAt('/customers/nordwerk/shipments', api)

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your shipments')
      expect(screen.getByRole('heading', { name: 'Your shipments' })).toBeInTheDocument()
    })
  })

  describe('table layout', () => {
    beforeEach(() => {
      mediaQuery = mockMatchMedia(true)
    })

    it('lists only the shipments of Nordwerk ordered by carrier ETA with the footer count', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      expect(await screen.findByText('Showing 6 of 6')).toBeInTheDocument()
      expect(getTableIds()).toEqual(['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051', 'SH-1053', 'SH-1009'])
    })

    it('lists the seven shipments of Alpen and none of another customer', async () => {
      renderPageAt('/customers/alpen-werkzeug/shipments')

      expect(await screen.findByText('Showing 7 of 7')).toBeInTheDocument()
      expect(getTableIds()).not.toContain('SH-1042')
      expect(getTableIds()).toContain('SH-1055')
    })

    it('shows the purchase order and the modes in leg order but never a carrier name', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      await screen.findByText('Showing 6 of 6')
      const main = screen.getByRole('main')

      expect(within(main).getByText('Your PO 4500-1187')).toBeInTheDocument()
      expect(within(main).getAllByText('Road · Sea · Road')).toHaveLength(2)
      expect(main).not.toHaveTextContent(/Transauto|Nordsee/)
    })

    it('offers no sort control', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      await screen.findByText('Showing 6 of 6')

      expect(screen.queryByRole('button', { name: /ETA|Confidence/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('combobox', { name: 'Sort by' })).not.toBeInTheDocument()
    })

    it('does not show pagination when there is a single page', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      await screen.findByText('Showing 6 of 6')

      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
    })

    it('links a row to the detail route of the customer', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      await screen.findByText('Showing 6 of 6')

      expect(screen.getByRole('link', { name: 'SH-1042' })).toHaveAttribute('href', '/customers/nordwerk/shipments/SH-1042')
    })

    describe('proactive alert', () => {
      it('shows one banner for the most urgent shipment with +2 more', async () => {
        renderPageAt('/customers/nordwerk/shipments')

        const banner = await screen.findByRole('region', { name: 'Shipment alert' })

        expect(banner).toHaveTextContent('SH-1042 will arrive later than planned.')
        expect(within(banner).getByRole('button', { name: 'Show 2 more shipments that need attention' })).toHaveTextContent('+2 more')
        expect(screen.getAllByRole('region', { name: 'Shipment alert' })).toHaveLength(1)
      })

      it('shows the banner for Alpen without a more button', async () => {
        renderPageAt('/customers/alpen-werkzeug/shipments')

        const banner = await screen.findByRole('region', { name: 'Shipment alert' })

        expect(banner).toHaveTextContent('SH-1037 will arrive later than planned.')
        expect(within(banner).queryByRole('button')).not.toBeInTheDocument()
      })

      it('shows no banner for Brenner whose only open exception is stale tracking', async () => {
        renderPageAt('/customers/brenner-iberia/shipments')

        await screen.findByText('Showing 5 of 5')

        expect(screen.queryByRole('region', { name: 'Shipment alert' })).not.toBeInTheDocument()
      })

      it('selects the Needs attention tab when +2 more is pressed', async () => {
        renderPageAt('/customers/nordwerk/shipments')

        await userEvent.click(await screen.findByRole('button', { name: /Show 2 more shipments/ }))

        expect(getCurrentUrl()).toBe('/customers/nordwerk/shipments?tab=needsAttention')
        expect(screen.getByRole('tab', { name: 'Needs attention · 4' })).toHaveAttribute('aria-selected', 'true')
        expect(getTableIds()).toEqual(['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051'])
      })

      it('keeps the banner while another tab is active', async () => {
        renderPageAt('/customers/nordwerk/shipments?tab=delivered')

        await screen.findByText('Showing 1 of 1')

        expect(screen.getByRole('region', { name: 'Shipment alert' })).toHaveTextContent('SH-1042')
      })

      it('alerts for a stale shipment once its notice was sent', async () => {
        const base = createTestApi()
        const api: ShipmentsApi = {
          ...base,
          listShipments: async () => (await base.listShipments()).map(shipment => shipment.id === 'SH-1029'
            ? {
                ...shipment,
                exceptions: shipment.exceptions.map(exception => ({
                  ...exception,
                  draft: { status: 'sent' as const, body: 'Hello', notifiedAt: '2026-10-20T10:00:00.000Z' },
                })),
              }
            : shipment),
        }

        renderPageAt('/customers/brenner-iberia/shipments', api)

        const banner = await screen.findByRole('region', { name: 'Shipment alert' })

        expect(banner).toHaveTextContent('SH-1029 will arrive later than planned.')
      })
    })

    describe('tabs', () => {
      it('shows the counts of every tab', async () => {
        renderPageAt('/customers/nordwerk/shipments')

        await screen.findByText('Showing 6 of 6')

        expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual([
          'All · 6',
          'Needs attention · 4',
          'In transit · 5',
          'Delivered · 1',
        ])
      })

      it('shows only delivered shipments on the Delivered tab', async () => {
        renderPageAt('/customers/nordwerk/shipments')
        await screen.findByText('Showing 6 of 6')

        await userEvent.click(screen.getByRole('tab', { name: 'Delivered · 1' }))

        expect(getTableIds()).toEqual(['SH-1009'])
        expect(getCurrentUrl()).toBe('/customers/nordwerk/shipments?tab=delivered')
      })

      it('includes at-risk and stale shipments on the In transit tab', async () => {
        renderPageAt('/customers/nordwerk/shipments?tab=inTransit')

        expect(await screen.findByText('Showing 5 of 5')).toBeInTheDocument()
        expect(getTableIds()).toEqual(['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051', 'SH-1053'])
      })

      it('removes the tab param when All is chosen again', async () => {
        renderPageAt('/customers/nordwerk/shipments?tab=delivered')
        await screen.findByText('Showing 1 of 1')

        await userEvent.click(screen.getByRole('tab', { name: 'All · 6' }))

        expect(getCurrentUrl()).toBe('/customers/nordwerk/shipments')
      })

      it('keeps the counts when a search is active', async () => {
        renderPageAt('/customers/nordwerk/shipments?q=munich')

        expect(await screen.findByText('Showing 1 of 1')).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'All · 6' })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'Delivered · 1' })).toBeInTheDocument()
      })

      it('shows the empty state without Clear search on the Delivered tab of Alpen', async () => {
        renderPageAt('/customers/alpen-werkzeug/shipments?tab=delivered')

        expect(await screen.findByText('No shipments to show')).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: 'Delivered · 0' })).toHaveAttribute('aria-selected', 'true')
        expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
      })
    })

    describe('search', () => {
      it('filters by shipment id and writes q to the URL', async () => {
        renderPageAt('/customers/nordwerk/shipments')
        await screen.findByText('Showing 6 of 6')

        await userEvent.type(screen.getByRole('searchbox', { name: 'Search your shipments' }), 'SH-1051')

        expect(await screen.findByText('Showing 1 of 1')).toBeInTheDocument()
        expect(getTableIds()).toEqual(['SH-1051'])
        expect(getCurrentUrl()).toBe('/customers/nordwerk/shipments?q=SH-1051')
      })

      it('filters by purchase order number', async () => {
        renderPageAt('/customers/nordwerk/shipments?q=4500-1189')

        expect(await screen.findByText('Showing 1 of 1')).toBeInTheDocument()
        expect(getTableIds()).toEqual(['SH-1035'])
      })

      it('shows the empty state with Clear search and restores the list', async () => {
        renderPageAt('/customers/nordwerk/shipments?q=zzzz')

        expect(await screen.findByText('No shipments to show')).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

        expect(await screen.findByText('Showing 6 of 6')).toBeInTheDocument()
        expect(getCurrentUrl()).toBe('/customers/nordwerk/shipments')
      })

      it('shows the empty state when searching for a carrier name', async () => {
        renderPageAt('/customers/nordwerk/shipments?q=nordsee')

        expect(await screen.findByText('No shipments to show')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
      })

      it('never finds the shipment of another customer', async () => {
        renderPageAt('/customers/alpen-werkzeug/shipments?q=SH-1042')

        expect(await screen.findByText('No shipments to show')).toBeInTheDocument()
      })
    })

    describe('detail route', () => {
      it('shows the list for a shipment of the customer', async () => {
        renderPageAt('/customers/nordwerk/shipments/SH-1042')

        expect(await screen.findByText('Showing 6 of 6')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Your shipments' })).toBeInTheDocument()
      })

      it('shows "Page not found" for a shipment of another customer', async () => {
        renderPageAt('/customers/nordwerk/shipments/SH-1037')

        expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Your shipments' })).not.toBeInTheDocument()
      })

      it('shows "Page not found" for an unknown shipment', async () => {
        renderPageAt('/customers/nordwerk/shipments/SH-9999')

        expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      })
    })
  })

  describe('card layout', () => {
    beforeEach(() => {
      mediaQuery = mockMatchMedia(false)
    })

    it('lists the cards in carrier ETA order with the compact alert', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      expect(await screen.findByText('Showing 6 of 6')).toBeInTheDocument()
      expect(getCardIds()).toEqual(['SH-1058', 'SH-1035', 'SH-1042', 'SH-1051', 'SH-1053', 'SH-1009'])
      expect(screen.getByRole('region', { name: 'Shipment alert' })).toHaveTextContent('SH-1042 delayed:')
    })

    it('shows the purchase order on a card but no carrier name', async () => {
      renderPageAt('/customers/nordwerk/shipments')

      await screen.findByText('Showing 6 of 6')
      const list = screen.getByRole('list', { name: 'Shipments' })

      expect(within(list).getByText('SH-1042 · PO 4500-1187')).toBeInTheDocument()
      expect(list).not.toHaveTextContent(/Transauto|Nordsee/)
    })

    it('switches to the table when the viewport grows', async () => {
      renderPageAt('/customers/nordwerk/shipments')
      await screen.findByText('Showing 6 of 6')

      act(() => mediaQuery?.setMatches(true))

      expect(await screen.findByRole('table', { name: 'Shipments' })).toBeInTheDocument()
    })
  })
})
