import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { Toaster } from '@/components/ui/sonner'
import { AppRoutes } from '@/Router'
import { createTestApi } from '@/test/createTestApi'
import { renderWithProviders } from '@/test/renderWithProviders'

function CurrentPath() {
  const { pathname } = useLocation()

  return <output aria-label="Current path">{pathname}</output>
}

function renderRouterAt(initialPath: string, api: ShipmentsApi = createTestApi()) {
  return renderWithProviders(
    <>
      <AppRoutes />
      <CurrentPath />
      <Toaster />
    </>,
    { initialPath, api },
  )
}

function expectPath(pathname: string) {
  expect(screen.getByLabelText('Current path')).toHaveTextContent(pathname)
}

async function chooseViewer(optionName: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Viewing as' }))
  await userEvent.click(await screen.findByRole('option', { name: optionName }))
}

describe('Router', () => {
  describe('home redirect', () => {
    it('redirects "/" to the ops exceptions page', async () => {
      renderRouterAt('/')

      expect(await screen.findByRole('heading', { name: /Exceptions/ })).toBeInTheDocument()
      expectPath('/ops/exceptions')
    })
  })

  describe('demo strip', () => {
    it('shows the demo mode notice on every shell page', async () => {
      renderRouterAt('/ops/shipments')

      expect(await screen.findByText('Demo mode · synthetic data, no real login')).toBeInTheDocument()
    })

    it('applies the event, re-orders the inbox and offers a View action to ops', async () => {
      renderRouterAt('/ops/exceptions')
      await screen.findByRole('link', { name: /^Exceptions\s*5$/ })

      await userEvent.click(screen.getByRole('button', { name: /Simulate/ }))

      expect(await screen.findByText('SH-1060: vessel rolled to the next sailing')).toBeInTheDocument()
      expect(await screen.findByRole('link', { name: /^Exceptions\s*6$/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('says so when the ops script has no event left', async () => {
      const api = createTestApi()
      for (let eventCount = 0; eventCount < 9; eventCount += 1) {
        await api.simulateCarrierEvent({ role: 'ops' })
      }
      renderRouterAt('/ops/exceptions', api)
      await screen.findByRole('link', { name: /^Exceptions\s*\d+$/ })

      await userEvent.click(screen.getByRole('button', { name: /Simulate/ }))

      expect(await screen.findByText('No more events here. Reset the demo to run them again.')).toBeInTheDocument()
    })

    it('clears the New marker when ops open the exception', async () => {
      const api = createTestApi()
      await api.simulateCarrierEvent({ role: 'ops' })
      renderRouterAt('/ops/exceptions', api)
      expect(await screen.findByText('New')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('link', { name: /SH-1060/ }))

      await waitFor(() => expect(screen.queryByText('New')).not.toBeInTheDocument())
    })

    it('shows customers an event on their own shipment with a View action', async () => {
      renderRouterAt('/customers/nordwerk/shipments')
      await screen.findByRole('button', { name: /Simulate/ })

      await userEvent.click(screen.getByRole('button', { name: /Simulate/ }))

      expect(await screen.findByText('SH-1053: vessel waiting for a berth in Rotterdam')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
    })
  })

  describe('exception that gets resolved', () => {
    it('redirects the open exception to the ops shipment detail when a carrier event closes it', async () => {
      const api = createTestApi()
      await api.simulateCarrierEvent({ role: 'ops' })
      await api.simulateCarrierEvent({ role: 'ops' })
      renderRouterAt('/ops/exceptions/SH-1042', api)
      await screen.findByRole('heading', { level: 1, name: /^SH-1042/ })

      await userEvent.click(screen.getByRole('button', { name: /Simulate/ }))

      await waitFor(() => expectPath('/ops/shipments/SH-1042'))
      expect(await screen.findByText('SH-1042: customs released the container')).toBeInTheDocument()
    })

    it('redirects an in-scope shipment that has no open exception to its ops shipment detail', async () => {
      renderRouterAt('/ops/exceptions/SH-1033')

      await waitFor(() => expectPath('/ops/shipments/SH-1033'))
    })

    it('keeps showing the unavailable message for an unknown shipment id', async () => {
      renderRouterAt('/ops/exceptions/SH-9999')

      expect((await screen.findAllByText('This exception isn\'t available')).length).toBeGreaterThan(0)
      expectPath('/ops/exceptions/SH-9999')
    })
  })

  describe('ops tabs', () => {
    it('shows 5 exceptions and 16 shipments for the ops scope, leaving Lyon out', async () => {
      renderRouterAt('/ops/exceptions')

      expect(await screen.findByRole('link', { name: /^Exceptions\s*5$/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /^All shipments\s*16$/ })).toBeInTheDocument()
    })

    it('marks the exceptions tab as current on the exceptions page', async () => {
      renderRouterAt('/ops/exceptions')

      expect(await screen.findByRole('link', { name: /^Exceptions/ })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /^All shipments/ })).not.toHaveAttribute('aria-current')
    })

    it('navigates to the all-shipments page and marks its tab as current', async () => {
      renderRouterAt('/ops/exceptions')

      await userEvent.click(await screen.findByRole('link', { name: /^All shipments/ }))

      expect(await screen.findByRole('heading', { name: 'All shipments' })).toBeInTheDocument()
      expectPath('/ops/shipments')
      expect(screen.getByRole('link', { name: /^All shipments/ })).toHaveAttribute('aria-current', 'page')
    })

    it('keeps the tabs on an ops detail route and marks the matching tab', async () => {
      renderRouterAt('/ops/shipments/SH-1042')

      expect(await screen.findByRole('link', { name: /^All shipments/ })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: /^Exceptions/ })).not.toHaveAttribute('aria-current')
    })

    it('shows no tabs on a customer page', async () => {
      renderRouterAt('/customers/nordwerk/shipments')

      await screen.findByRole('heading', { name: 'Your shipments' })

      expect(screen.queryByRole('navigation', { name: 'Ops views' })).not.toBeInTheDocument()
    })
  })

  describe('viewing as', () => {
    it('lists Ops and the three customers', async () => {
      renderRouterAt('/ops/exceptions')

      await userEvent.click(await screen.findByRole('combobox', { name: 'Viewing as' }))

      const options = within(await screen.findByRole('listbox')).getAllByRole('option')
      expect(options.map(option => option.textContent)).toEqual([
        'Ops · Spain sites',
        'Nordwerk GmbH',
        'Brenner Iberia S.L.',
        'Alpen Werkzeug AG',
      ])
    })

    it('shows Ops as the selected viewer on an ops page', async () => {
      renderRouterAt('/ops/exceptions')

      expect(await screen.findByRole('combobox', { name: 'Viewing as' })).toHaveTextContent('Ops · Spain sites')
    })

    it('goes to the customer page when a customer is chosen', async () => {
      renderRouterAt('/ops/exceptions')
      await screen.findByRole('link', { name: /^Exceptions\s*5$/ })

      await chooseViewer('Brenner Iberia S.L.')

      expect(await screen.findByRole('heading', { name: 'Your shipments' })).toBeInTheDocument()
      expectPath('/customers/brenner-iberia/shipments')
      expect(screen.getByRole('combobox', { name: 'Viewing as' })).toHaveTextContent('Brenner Iberia S.L.')
    })

    it('goes back to the exceptions inbox when Ops is chosen from a customer page', async () => {
      renderRouterAt('/customers/nordwerk/shipments')
      await screen.findByRole('heading', { name: 'Your shipments' })

      await chooseViewer('Ops · Spain sites')

      expect(await screen.findByRole('heading', { name: /Exceptions/ })).toBeInTheDocument()
      expectPath('/ops/exceptions')
    })

    it('lands on the target customer list when switching from a detail page', async () => {
      renderRouterAt('/customers/nordwerk/shipments/SH-1042')
      await screen.findByRole('heading', { name: /SH-1042/ })

      await chooseViewer('Alpen Werkzeug AG')

      await waitFor(() => expectPath('/customers/alpen-werkzeug/shipments'))
    })

    it('lands on the exceptions list when switching to Ops from a customer detail page', async () => {
      renderRouterAt('/customers/nordwerk/shipments/SH-1042')
      await screen.findByRole('heading', { name: /SH-1042/ })

      await chooseViewer('Ops · Spain sites')

      await waitFor(() => expectPath('/ops/exceptions'))
    })
  })

  describe('unknown routes', () => {
    it('shows "Page not found" inside the shell for an unknown customer', async () => {
      renderRouterAt('/customers/unknown-co/shipments')

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Viewing as' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Your shipments' })).not.toBeInTheDocument()
    })

    it('shows "Page not found" for a path that matches no route', async () => {
      renderRouterAt('/nowhere')

      expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
      expect(screen.queryByRole('combobox', { name: 'Viewing as' })).not.toBeInTheDocument()
      expectPath('/nowhere')
    })
  })

  describe('reset demo', () => {
    it('refreshes the data, confirms with a toast and stays on the route', async () => {
      const api = createTestApi()
      await api.simulateCarrierEvent({ role: 'ops' })
      renderRouterAt('/ops/shipments', api)
      await screen.findByRole('link', { name: /^Exceptions\s*6$/ })

      await userEvent.click(screen.getByRole('button', { name: 'Reset demo' }))

      expect(await screen.findByText('Demo reset')).toBeInTheDocument()
      expect(await screen.findByRole('link', { name: /^Exceptions\s*5$/ })).toBeInTheDocument()
      expectPath('/ops/shipments')
      expect(screen.getByRole('heading', { name: 'All shipments' })).toBeInTheDocument()
    })

    it('shows an error toast and stays on the route when the reset fails', async () => {
      const api: ShipmentsApi = {
        ...createTestApi(),
        resetDemo: () => Promise.reject(new Error('Storage unavailable')),
      }
      renderRouterAt('/ops/shipments', api)
      await screen.findByRole('link', { name: /^Exceptions\s*5$/ })

      await userEvent.click(screen.getByRole('button', { name: 'Reset demo' }))

      expect(await screen.findByText('Could not reset the demo. Try again.')).toBeInTheDocument()
      expect(screen.queryByText('Demo reset')).not.toBeInTheDocument()
      expectPath('/ops/shipments')
    })
  })
})
