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

    it('keeps the simulate button clickable without changing the page', async () => {
      renderRouterAt('/ops/exceptions')
      await screen.findByRole('link', { name: /^Exceptions\s*5$/ })

      await userEvent.click(screen.getByRole('button', { name: /Simulate/ }))

      expect(screen.getByRole('link', { name: /^Exceptions\s*5$/ })).toBeInTheDocument()
      expect(screen.queryByText('Demo reset')).not.toBeInTheDocument()
      expectPath('/ops/exceptions')
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
      expect(within(screen.getByRole('main')).getByText('Brenner Iberia S.L.')).toBeInTheDocument()
    })

    it('goes back to the exceptions inbox when Ops is chosen from a customer page', async () => {
      renderRouterAt('/customers/nordwerk/shipments')
      await screen.findByRole('heading', { name: 'Your shipments' })

      await chooseViewer('Ops · Spain sites')

      expect(await screen.findByRole('heading', { name: /Exceptions/ })).toBeInTheDocument()
      expectPath('/ops/exceptions')
    })

    it('lands on the target customer list when switching from a detail page', async () => {
      renderRouterAt('/customers/nordwerk/shipments/SH-1029')
      await screen.findByRole('heading', { name: 'Your shipments' })

      await chooseViewer('Alpen Werkzeug AG')

      await waitFor(() => expectPath('/customers/alpen-werkzeug/shipments'))
    })

    it('lands on the exceptions list when switching to Ops from a customer detail page', async () => {
      renderRouterAt('/customers/nordwerk/shipments/SH-1029')
      await screen.findByRole('heading', { name: 'Your shipments' })

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
      await api.simulateCarrierEvent()
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
