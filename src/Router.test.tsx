import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { IntlProvider } from 'react-intl'
import { ShipmentsApiProvider } from '@/api/ShipmentsApiProvider'
import { createMockDb } from '@/api/mockDb'
import { createShipmentsApi, type ShipmentsApi } from '@/api/shipmentsApi'
import { Toaster } from '@/components/ui/sonner'
import { config } from '@/config'
import { messages } from '@/locales/en'
import { Router } from '@/Router'

function createTestApi(): ShipmentsApi {
  return createShipmentsApi({
    db: createMockDb({ storage: { getItem: () => null, setItem: () => {} } }),
    latencyMs: 0,
  })
}

/**
 * `Router` owns a `BrowserRouter`, which cannot be nested in the `MemoryRouter` that
 * `renderWithProviders` adds, so this file wires the same providers around it and drives the
 * location through the History API.
 */
function renderRouterAt(path: string, api: ShipmentsApi = createTestApi()) {
  window.history.pushState({}, '', path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ShipmentsApiProvider api={api}>
          <IntlProvider locale={config.defaultLocale} messages={messages}>
            <Router />
            <Toaster />
          </IntlProvider>
        </ShipmentsApiProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

async function chooseViewer(optionName: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Viewing as' }))
  await userEvent.click(await screen.findByRole('option', { name: optionName }))
}

describe('Router', () => {
  describe('home redirect', () => {
    it('redirects "/" to the ops exceptions page', async () => {
      renderRouterAt('/')

      expect(await screen.findByRole('heading', { name: 'Exceptions inbox' })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/ops/exceptions')
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
      expect(window.location.pathname).toBe('/ops/exceptions')
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
      expect(window.location.pathname).toBe('/ops/shipments')
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
      expect(window.location.pathname).toBe('/customers/brenner-iberia/shipments')
      expect(screen.getByRole('combobox', { name: 'Viewing as' })).toHaveTextContent('Brenner Iberia S.L.')
      expect(screen.getByText('Brenner Iberia S.L.', { selector: 'p' })).toBeInTheDocument()
    })

    it('goes back to the exceptions inbox when Ops is chosen from a customer page', async () => {
      renderRouterAt('/customers/nordwerk/shipments')
      await screen.findByRole('heading', { name: 'Your shipments' })

      await chooseViewer('Ops · Spain sites')

      expect(await screen.findByRole('heading', { name: 'Exceptions inbox' })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/ops/exceptions')
    })

    it('lands on the target customer list when switching from a detail page', async () => {
      renderRouterAt('/customers/nordwerk/shipments/SH-1029')
      await screen.findByRole('heading', { name: 'Your shipments' })

      await chooseViewer('Alpen Werkzeug AG')

      await waitFor(() => expect(window.location.pathname).toBe('/customers/alpen-werkzeug/shipments'))
    })

    it('lands on the exceptions list when switching to Ops from a customer detail page', async () => {
      renderRouterAt('/customers/nordwerk/shipments/SH-1029')
      await screen.findByRole('heading', { name: 'Your shipments' })

      await chooseViewer('Ops · Spain sites')

      await waitFor(() => expect(window.location.pathname).toBe('/ops/exceptions'))
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
      expect(window.location.pathname).toBe('/ops/shipments')
      expect(screen.getByRole('heading', { name: 'All shipments' })).toBeInTheDocument()
    })
  })
})
