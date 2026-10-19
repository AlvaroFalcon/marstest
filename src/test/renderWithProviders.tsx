import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { IntlProvider } from 'react-intl'
import { MemoryRouter } from 'react-router'
import { config } from '@/config'
import { messages } from '@/locales/en'

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  /** Initial URL of the in-memory router, e.g. `/shipments?page=2`. */
  initialPath?: string
}

/**
 * Renders a component inside the same providers as the real app (router, i18n, query
 * client). A fresh QueryClient per call keeps cached data from leaking between tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialPath = '/', ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale={config.defaultLocale} messages={messages}>
        <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
      </IntlProvider>
    </QueryClientProvider>,
    options,
  )
}
