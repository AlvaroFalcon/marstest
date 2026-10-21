import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { IntlProvider } from 'react-intl'
import { ShipmentsApiProvider } from '@/api/ShipmentsApiProvider'
import { Toaster } from '@/components/ui/sonner'
import { config } from '@/config'
import { messages } from '@/locales/en'
import { Router } from '@/Router'

const queryClient = new QueryClient()

/**
 * Application root: wires the global providers (theme, server state, shipments API, i18n) and the
 * toast outlet around the router. Providers live here and nowhere else so pages and components
 * stay free of setup code.
 */
export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ShipmentsApiProvider>
          <IntlProvider locale={config.defaultLocale} messages={messages}>
            <Router />
            <Toaster />
          </IntlProvider>
        </ShipmentsApiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
