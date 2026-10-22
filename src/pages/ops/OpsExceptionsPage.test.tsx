import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { OpsExceptionsPage } from '@/pages/ops/OpsExceptionsPage'
import { createTestApi } from '@/test/createTestApi'
import { mockMatchMedia, type MockMatchMedia } from '@/test/mockMatchMedia'
import { renderWithProviders } from '@/test/renderWithProviders'

function CurrentUrl() {
  const { pathname, search } = useLocation()

  return <output aria-label="Current URL">{`${pathname}${search}`}</output>
}

function renderPageAt(initialPath: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/ops/exceptions" element={<OpsExceptionsPage />} />
        <Route path="/ops/exceptions/:shipmentId" element={<OpsExceptionsPage />} />
      </Routes>
      <CurrentUrl />
    </>,
    { initialPath, api },
  )
}

function expectUrl(url: string) {
  expect(screen.getByLabelText('Current URL').textContent).toBe(url)
}

async function findCardShipmentIds(): Promise<string[]> {
  const list = await screen.findByRole('list', { name: 'Open exceptions' })

  return within(list).getAllByRole('link').map(card => /SH-\d+/.exec(card.textContent)?.[0] ?? '')
}

describe('OpsExceptionsPage', () => {
  let mediaQuery: MockMatchMedia

  afterEach(() => {
    mediaQuery.restore()
  })

  describe('on desktop', () => {
    beforeEach(() => {
      mediaQuery = mockMatchMedia(true)
    })

    it('lists the ops exceptions ordered by urgency', async () => {
      renderPageAt('/ops/exceptions')

      expect(await findCardShipmentIds()).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
    })

    it('leaves the out-of-scope Lyon shipment out of the list', async () => {
      renderPageAt('/ops/exceptions')

      await findCardShipmentIds()

      expect(screen.queryByRole('link', { name: /SH-1058/ })).not.toBeInTheDocument()
    })

    it('shows route, reason and badge on the first card', async () => {
      renderPageAt('/ops/exceptions')

      const card = await screen.findByRole('link', { name: /SH-1042/ })

      expect(card).toHaveTextContent('SH-1042 · Zaragoza → Birmingham')
      expect(card).toHaveTextContent('UK customs is holding the container at Southampton.')
      expect(card).toHaveTextContent('Customs hold')
    })

    it('shows the KPIs of all the ops sites', async () => {
      renderPageAt('/ops/exceptions')

      await findCardShipmentIds()

      expect(screen.getByText('Need attention').closest('div')).toHaveTextContent(/Need attention\s*5$/)
      expect(screen.getByText('Stale over 24 h').closest('div')).toHaveTextContent(/Stale over 24 h\s*2$/)
      expect(screen.getByText('9 of 16')).toBeInTheDocument()
    })

    it('shows the select-an-exception placeholder when no exception is open', async () => {
      renderPageAt('/ops/exceptions')

      expect(await screen.findByText('Select an exception')).toBeInTheDocument()
    })

    it('highlights the open card and shows its detail', async () => {
      renderPageAt('/ops/exceptions/SH-1042')

      expect(await screen.findByRole('link', { name: /SH-1042/ })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /SH-1051/ })).not.toHaveAttribute('aria-current')
      expect(await screen.findByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeInTheDocument()
    })

    it('shows the inbox and the SH-1042 detail with its document check side by side', async () => {
      renderPageAt('/ops/exceptions/SH-1042')

      const documents = await screen.findByRole('list', { name: 'Documents checked against the ERP order' })

      expect(screen.getByRole('list', { name: 'Open exceptions' })).toBeInTheDocument()
      expect(within(documents).getAllByRole('listitem')).toHaveLength(5)
      expect(screen.queryByRole('link', { name: 'Back to exceptions' })).not.toBeInTheDocument()
    })

    it('opens the detail URL when a card is pressed and keeps the site filter', async () => {
      renderPageAt('/ops/exceptions?site=bilbao-plant')

      await userEvent.click(await screen.findByRole('link', { name: /SH-1051/ }))

      expectUrl('/ops/exceptions/SH-1051?site=bilbao-plant')
      expect(screen.getByRole('link', { name: /SH-1051/ })).toHaveAttribute('aria-current', 'page')
    })

    it('does not highlight a card for an unknown id and never reveals it', async () => {
      renderPageAt('/ops/exceptions/SH-9999')

      await findCardShipmentIds()

      expect(screen.queryAllByRole('link', { current: 'page' })).toHaveLength(0)
      expect(await screen.findByText('This exception isn\'t available')).toBeInTheDocument()
    })

    it('does not highlight a card for the out-of-scope Lyon shipment', async () => {
      renderPageAt('/ops/exceptions/SH-1058')

      await findCardShipmentIds()

      expect(screen.queryAllByRole('link', { current: 'page' })).toHaveLength(0)
    })

    it('does not highlight the open card when the site filter hides it', async () => {
      renderPageAt('/ops/exceptions/SH-1042?site=bilbao-plant')

      expect(await findCardShipmentIds()).toEqual(['SH-1051', 'SH-1029'])
      expect(screen.queryAllByRole('link', { current: 'page' })).toHaveLength(0)
    })

    describe('site filter', () => {
      it('filters the list by the site in the URL', async () => {
        renderPageAt('/ops/exceptions?site=bilbao-plant')

        expect(await findCardShipmentIds()).toEqual(['SH-1051', 'SH-1029'])
      })

      it('narrows the KPIs to the selected site', async () => {
        renderPageAt('/ops/exceptions?site=bilbao-plant')

        await findCardShipmentIds()

        expect(screen.getByText('Need attention').closest('div')).toHaveTextContent(/Need attention\s*2$/)
        expect(screen.getByText('Stale over 24 h').closest('div')).toHaveTextContent(/Stale over 24 h\s*1$/)
        expect(screen.getByText('4 of 6')).toBeInTheDocument()
      })

      it('shows the exception count of the selected site on the trigger', async () => {
        renderPageAt('/ops/exceptions?site=bilbao-plant')

        expect(await screen.findByRole('button', { name: 'Bilbao plant (2)' })).toBeInTheDocument()
      })

      it('keeps the per-site counts and the tab-wide total unfiltered', async () => {
        renderPageAt('/ops/exceptions?site=bilbao-plant')

        await userEvent.click(await screen.findByRole('button', { name: 'Bilbao plant (2)' }))

        expect(await screen.findByRole('radio', { name: 'All my sites 5 exceptions' })).toBeInTheDocument()
        expect(screen.getByRole('radio', { name: 'Zaragoza plant 3 exceptions' })).toBeInTheDocument()
        expect(screen.getByRole('radio', { name: 'Barcelona warehouse 0 exceptions' })).toBeInTheDocument()
      })

      it('lists Lyon locked as outside the scope', async () => {
        renderPageAt('/ops/exceptions')

        await userEvent.click(await screen.findByRole('button', { name: 'All my sites (3)' }))

        expect(await screen.findByText('Lyon warehouse · outside your scope')).toBeInTheDocument()
        expect(screen.queryByRole('radio', { name: /Lyon/ })).not.toBeInTheDocument()
      })

      it('writes the chosen site to the URL and filters the list', async () => {
        renderPageAt('/ops/exceptions')
        await userEvent.click(await screen.findByRole('button', { name: 'All my sites (3)' }))

        const bilbaoRow = await screen.findByRole('radio', { name: 'Bilbao plant 2 exceptions' })
        fireEvent.click(bilbaoRow)

        await waitFor(() => expectUrl('/ops/exceptions?site=bilbao-plant'))
        expect(await findCardShipmentIds()).toEqual(['SH-1051', 'SH-1029'])
      })

      it('drops the param from the URL when all sites is chosen again', async () => {
        renderPageAt('/ops/exceptions?site=bilbao-plant')
        await userEvent.click(await screen.findByRole('button', { name: 'Bilbao plant (2)' }))

        const allSitesRow = await screen.findByRole('radio', { name: 'All my sites 5 exceptions' })
        fireEvent.click(allSitesRow)

        await waitFor(() => expectUrl('/ops/exceptions'))
      })

      it('falls back to all sites and drops the param for the out-of-scope Lyon id', async () => {
        renderPageAt('/ops/exceptions?site=lyon-warehouse')

        expect(await findCardShipmentIds()).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
        await waitFor(() => expectUrl('/ops/exceptions'))
      })

      it('falls back to all sites and drops the param for an unknown id', async () => {
        renderPageAt('/ops/exceptions?site=atlantis')

        expect(await findCardShipmentIds()).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
        await waitFor(() => expectUrl('/ops/exceptions'))
        expect(screen.getByRole('button', { name: 'All my sites (3)' })).toBeInTheDocument()
      })

      it('shows the empty-at-site state for a site without exceptions and recovers with "Show all my sites"', async () => {
        renderPageAt('/ops/exceptions?site=barcelona-warehouse')
        expect(await screen.findByText('No open exceptions at this site')).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: 'Show all my sites' }))

        expect(await findCardShipmentIds()).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
      })
    })

    describe('states', () => {
      it('shows the loading state before the data arrives', () => {
        renderPageAt('/ops/exceptions')

        expect(screen.getByText('Loading exceptions')).toBeInTheDocument()
      })

      it('shows the error state and recovers when "Try again" is pressed', async () => {
        const healthyApi = createTestApi()
        let shouldFail = true
        const api: ShipmentsApi = {
          ...healthyApi,
          listExceptions: () => shouldFail
            ? Promise.reject(new Error('Network down'))
            : healthyApi.listExceptions(),
        }
        renderPageAt('/ops/exceptions', api)
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the exceptions')

        shouldFail = false
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

        expect(await findCardShipmentIds()).toEqual(['SH-1042', 'SH-1051', 'SH-1037', 'SH-1035', 'SH-1029'])
      })
    })
  })

  describe('on mobile', () => {
    beforeEach(() => {
      mediaQuery = mockMatchMedia(false)
    })

    it('shows only the inbox, without the detail placeholder, when no exception is open', async () => {
      renderPageAt('/ops/exceptions')

      expect(await findCardShipmentIds()).toHaveLength(5)
      expect(screen.queryByText('Select an exception')).not.toBeInTheDocument()
    })

    it('shows only the detail with a back link when an exception is open', async () => {
      renderPageAt('/ops/exceptions/SH-1042')

      expect(await screen.findByRole('heading', { level: 1, name: 'SH-1042 · Zaragoza → Birmingham' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to exceptions' })).toHaveAttribute('href', '/ops/exceptions')
      expect(screen.queryByRole('list', { name: 'Open exceptions' })).not.toBeInTheDocument()
    })

    it('keeps the back link when the detail is unavailable', async () => {
      renderPageAt('/ops/exceptions/SH-9999?site=bilbao-plant')

      expect(await screen.findByText('This exception isn\'t available')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to exceptions' })).toHaveAttribute('href', '/ops/exceptions?site=bilbao-plant')
    })

    it('keeps the site filter in the back link', async () => {
      renderPageAt('/ops/exceptions/SH-1051?site=bilbao-plant')

      const backLink = await screen.findByRole('link', { name: 'Back to exceptions' })

      expect(backLink).toHaveAttribute('href', '/ops/exceptions?site=bilbao-plant')
    })

    it('returns to the filtered inbox when the back link is pressed', async () => {
      renderPageAt('/ops/exceptions/SH-1051?site=bilbao-plant')

      await userEvent.click(await screen.findByRole('link', { name: 'Back to exceptions' }))

      expectUrl('/ops/exceptions?site=bilbao-plant')
      expect(await findCardShipmentIds()).toEqual(['SH-1051', 'SH-1029'])
    })

    it('opens the filter as a bottom sheet', async () => {
      renderPageAt('/ops/exceptions')

      await userEvent.click(await screen.findByRole('button', { name: 'All my sites (3)' }))

      expect(await screen.findByRole('dialog', { name: 'Filter by site' })).toBeInTheDocument()
    })
  })
})
