import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IntlProvider } from 'react-intl'
import { config } from '@/config'
import { messages } from '@/locales/en'
import { Router } from '@/Router'

const queryClient = new QueryClient()

/**
 * Application root: wires the global providers (server state, i18n) around the router.
 * Providers live here and nowhere else so pages and components stay free of setup code.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IntlProvider locale={config.defaultLocale} messages={messages}>
        <Router />
      </IntlProvider>
    </QueryClientProvider>
  )
}
