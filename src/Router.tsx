import { BrowserRouter, Route, Routes } from 'react-router'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import routes from '@/routes'

/**
 * Declares every page of the SPA. Paths always come from `routes.ts` so links
 * and route definitions cannot drift apart.
 */
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.home()} element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
