import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { IntlProvider } from 'react-intl'
import { MemoryRouter } from 'react-router'
import { ShipmentsApiProvider } from '@/api/ShipmentsApiProvider'
import type { ShipmentsApi } from '@/api/shipmentsApi'
import { config } from '@/config'
import { messages } from '@/locales/en'
import { createTestApi } from '@/test/createTestApi'

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  /** Initial URL of the in-memory router, e.g. `/shipments?page=2`. */
  initialPath?: string
  /** API instance for this render; defaults to a fresh seeded one with no latency and no storage. */
  api?: ShipmentsApi
}

/**
 * Renders a component inside the same providers as the real app (theme, router, i18n, query
 * client, shipments API). A fresh QueryClient per call keeps cached data from leaking between tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialPath = '/', api = createTestApi(), ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ShipmentsApiProvider api={api}>
          <IntlProvider locale={config.defaultLocale} messages={messages}>
            <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
          </IntlProvider>
        </ShipmentsApiProvider>
      </QueryClientProvider>
    </ThemeProvider>,
    options,
  )
}
