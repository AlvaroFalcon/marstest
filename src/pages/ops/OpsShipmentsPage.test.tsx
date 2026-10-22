import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { OpsShipmentsPage } from '@/pages/ops/OpsShipmentsPage'
import { createTestApi } from '@/test/createTestApi'
import { mockMatchMedia, type MockMatchMedia } from '@/test/mockMatchMedia'
import { renderWithProviders } from '@/test/renderWithProviders'

const firstPageIds = ['SH-1029', 'SH-1037', 'SH-1035', 'SH-1042', 'SH-1039', 'SH-1048', 'SH-1051', 'SH-1033']
const secondPageIds = ['SH-1034', 'SH-1053', 'SH-1047', 'SH-1060', 'SH-1066', 'SH-1009', 'SH-1012', 'SH-1044']

function LocationProbe() {
  const location = useLocation()

  return <output aria-label="Current URL">{location.pathname + location.search}</output>
}

function renderPage(initialPath = '/ops/shipments', api = createTestApi()) {
  return renderWithProviders(
    <>
      <OpsShipmentsPage />
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

describe('OpsShipmentsPage', () => {
  let mediaQuery: MockMatchMedia | null = null

  afterEach(() => {
    mediaQuery?.restore()
    mediaQuery = null
  })

  describe('table layout', () => {
    beforeEach(() => {
      mediaQuery = mockMatchMedia(true)
    })

    it('lists the first page ordered by carrier ETA with the footer count', async () => {
      renderPage()

      expect(await screen.findByText('Showing 8 of 16')).toBeInTheDocument()
      expect(getTableIds()).toEqual(firstPageIds)
    })

    it('marks the Carrier ETA header as ascending by default', async () => {
      renderPage()

      await screen.findByRole('table', { name: 'Shipments' })

      expect(screen.getByRole('columnheader', { name: 'Carrier ETA' })).toHaveAttribute('aria-sort', 'ascending')
      expect(screen.getByRole('columnheader', { name: 'Confidence' })).toHaveAttribute('aria-sort', 'none')
    })

    it('cycles Carrier ETA from ascending to descending and back to the default', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByRole('table', { name: 'Shipments' })

      await user.click(screen.getByRole('button', { name: 'Carrier ETA' }))

      expect(screen.getByRole('columnheader', { name: 'Carrier ETA' })).toHaveAttribute('aria-sort', 'descending')
      expect(getCurrentUrl()).toBe('/ops/shipments?sort=carrierEtaDesc')
      expect(getTableIds()).toEqual(['SH-1066', 'SH-1060', 'SH-1047', 'SH-1053', 'SH-1034', 'SH-1033', 'SH-1051', 'SH-1048'])

      await user.click(screen.getByRole('button', { name: 'Carrier ETA' }))

      expect(screen.getByRole('columnheader', { name: 'Carrier ETA' })).toHaveAttribute('aria-sort', 'ascending')
      expect(getCurrentUrl()).toBe('/ops/shipments')
    })

    it('sorts by highest confidence first on the first click on Confidence', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByRole('table', { name: 'Shipments' })

      await user.click(screen.getByRole('button', { name: 'Confidence' }))

      expect(screen.getByRole('columnheader', { name: 'Confidence' })).toHaveAttribute('aria-sort', 'descending')
      expect(screen.getByRole('columnheader', { name: 'Carrier ETA' })).toHaveAttribute('aria-sort', 'none')
      expect(getCurrentUrl()).toBe('/ops/shipments?sort=confidenceDesc')
    })

    it('goes to page 2 with the next button and writes it to the URL', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByRole('table', { name: 'Shipments' })

      await user.click(screen.getByRole('button', { name: 'Next page' }))

      expect(getTableIds()).toEqual(secondPageIds)
      expect(screen.getByText('Showing 8 of 16')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
      expect(getCurrentUrl()).toBe('/ops/shipments?page=2')
    })

    it('opens directly on page 2 when the URL says so', async () => {
      renderPage('/ops/shipments?page=2')

      await screen.findByRole('table', { name: 'Shipments' })

      expect(getTableIds()).toEqual(secondPageIds)
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled()
    })

    it('removes the page param when going back to page 1', async () => {
      const user = userEvent.setup()
      renderPage('/ops/shipments?page=2')
      await screen.findByRole('table', { name: 'Shipments' })

      await user.click(screen.getByRole('button', { name: 'Previous page' }))

      expect(getTableIds()).toEqual(firstPageIds)
      expect(getCurrentUrl()).toBe('/ops/shipments')
    })

    it('resets to page 1 when a status filter is applied', async () => {
      const user = userEvent.setup()
      renderPage('/ops/shipments?page=2')
      await screen.findByRole('table', { name: 'Shipments' })

      await user.click(screen.getByRole('button', { name: 'Status: all' }))
      fireEvent.click(screen.getByRole('radio', { name: 'At risk' }))

      expect(getCurrentUrl()).toBe('/ops/shipments?status=atRisk')
      expect(getTableIds()).toEqual(['SH-1037', 'SH-1035', 'SH-1042', 'SH-1051'])
      expect(screen.getByText('Showing 4 of 4')).toBeInTheDocument()
    })

    it('resets to page 1 when a site filter is applied', async () => {
      const user = userEvent.setup()
      renderPage('/ops/shipments?page=2')
      await screen.findByRole('table', { name: 'Shipments' })

      await user.click(screen.getByRole('button', { name: /^All my sites/ }))
      fireEvent.click(await screen.findByRole('radio', { name: /Barcelona warehouse/ }))

      expect(getCurrentUrl()).toBe('/ops/shipments?site=barcelona-warehouse')
      expect(screen.getByText('Showing 3 of 3')).toBeInTheDocument()
    })

    it('filters by search text after the debounce and replaces the URL param', async () => {
      const user = userEvent.setup()
      renderPage('/ops/shipments?page=2')
      await screen.findByRole('table', { name: 'Shipments' })

      await user.type(screen.getByRole('searchbox', { name: 'Search shipments' }), 'SH-1047')

      expect(await screen.findByText('Showing 1 of 1')).toBeInTheDocument()
      expect(getTableIds()).toEqual(['SH-1047'])
      expect(getCurrentUrl()).toBe('/ops/shipments?q=SH-1047')
    })

    it('shows the empty state and clears the filters from it', async () => {
      const user = userEvent.setup()
      renderPage('/ops/shipments?q=zzzz-no-match&status=atRisk')

      expect(await screen.findByText('No shipments match your filters')).toBeInTheDocument()
      expect(screen.queryByRole('table', { name: 'Shipments' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(await screen.findByText('Showing 8 of 16')).toBeInTheDocument()
      expect(getCurrentUrl()).toBe('/ops/shipments')
    })

    it('links every row to its shipment detail, including rows with an open exception', async () => {
      renderPage()
      await screen.findByRole('table', { name: 'Shipments' })

      expect(screen.getByRole('link', { name: 'SH-1029' })).toHaveAttribute('href', '/ops/shipments/SH-1029')
      expect(screen.getByRole('link', { name: 'SH-1039' })).toHaveAttribute('href', '/ops/shipments/SH-1039')
    })

    it('hands the current filters to the detail link so its back link can restore them', async () => {
      renderPage('/ops/shipments?status=atRisk&sort=confidenceDesc')
      await screen.findByRole('table', { name: 'Shipments' })

      expect(screen.getByRole('link', { name: 'SH-1035' })).toHaveAttribute(
        'href',
        '/ops/shipments/SH-1035?status=atRisk&sort=confidenceDesc',
      )
    })

    it('keeps delivered shipments and shipments without a carrier ETA last', async () => {
      renderPage('/ops/shipments?sort=carrierEtaDesc&page=2')
      await screen.findByRole('table', { name: 'Shipments' })

      expect(getTableIds().slice(-3)).toEqual(['SH-1009', 'SH-1012', 'SH-1044'])
    })
  })

  describe('cards layout', () => {
    beforeEach(() => {
      mediaQuery = mockMatchMedia(false)
    })

    it('lists the first page as cards instead of a table', async () => {
      renderPage()

      expect(await screen.findByText('Showing 8 of 16')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      expect(getCardIds()).toEqual(firstPageIds)
    })

    it('makes each card a link named after the shipment and customer', async () => {
      renderPage()

      const card = await screen.findByRole('link', { name: /^SH-1029 · Brenner Iberia S\.L\./ })

      expect(card).toHaveAttribute('href', '/ops/shipments/SH-1029')
    })

    it('sorts from the Sort by select instead of column headers', async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByRole('list', { name: 'Shipments' })

      await user.click(screen.getByRole('combobox', { name: 'Sort by' }))
      await user.click(screen.getByRole('option', { name: 'Confidence, highest first' }))

      expect(getCurrentUrl()).toBe('/ops/shipments?sort=confidenceDesc')
    })

    it('switches to the table when the viewport becomes wide', async () => {
      renderPage()
      await screen.findByRole('list', { name: 'Shipments' })

      act(() => mediaQuery?.setMatches(true))

      expect(await screen.findByRole('table', { name: 'Shipments' })).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows the error and loads the list after Try again', async () => {
      const user = userEvent.setup()
      const api = createTestApi()
      const realListShipments = api.listShipments
      let shouldFail = true
      api.listShipments = () => (shouldFail ? Promise.reject(new Error('offline')) : realListShipments())
      renderPage('/ops/shipments', api)

      expect(await screen.findByText('Could not load the shipments')).toBeInTheDocument()

      shouldFail = false
      await user.click(screen.getByRole('button', { name: 'Try again' }))

      expect(await screen.findByText('Showing 8 of 16')).toBeInTheDocument()
    })
  })
})
