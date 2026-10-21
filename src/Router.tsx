import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { OpsLayout } from '@/components/layout/OpsLayout'
import { PageGutter } from '@/components/layout/PageGutter'
import { CustomerShipmentsPage } from '@/pages/customers/CustomerShipmentsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OpsExceptionsPage } from '@/pages/ops/OpsExceptionsPage'
import { OpsShipmentsPage } from '@/pages/ops/OpsShipmentsPage'
import routes from '@/routes'

/**
 * Declares every page of the SPA. Paths always come from `routes.ts` so links
 * and route definitions cannot drift apart. Ops and customer pages share the app shell;
 * ops pages add their tabs.
 */
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.home()} element={<Navigate to={routes.ops.exceptions()} replace />} />
        <Route element={<AppLayout />}>
          <Route element={<OpsLayout />}>
            <Route path={routes.ops.exceptions()} element={<OpsExceptionsPage />} />
            <Route path={routes.ops.exception(':shipmentId')} element={<OpsExceptionsPage />} />
            <Route path={routes.ops.shipments()} element={<OpsShipmentsPage />} />
            <Route path={routes.ops.shipment(':shipmentId')} element={<OpsShipmentsPage />} />
          </Route>
          <Route path={routes.customer.shipments(':customerId')} element={<CustomerShipmentsPage />} />
          <Route path={routes.customer.shipment(':customerId', ':shipmentId')} element={<CustomerShipmentsPage />} />
        </Route>
        <Route
          path="*"
          element={(
            <div className="@container flex min-h-svh flex-col">
              <PageGutter>
                <NotFoundPage />
              </PageGutter>
            </div>
          )}
        />
      </Routes>
    </BrowserRouter>
  )
}
