import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { OpsLayout } from '@/components/layout/OpsLayout'
import { StandalonePageLayout } from '@/components/layout/StandalonePageLayout'
import { CustomerShipmentsPage } from '@/pages/customers/CustomerShipmentsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OpsExceptionsPage } from '@/pages/ops/OpsExceptionsPage'
import { OpsShipmentPage } from '@/pages/ops/OpsShipmentPage'
import { OpsShipmentsPage } from '@/pages/ops/OpsShipmentsPage'
import routes from '@/routes'

/**
 * Declares every page of the SPA. Paths always come from `routes.ts` so links
 * and route definitions cannot drift apart. Ops and customer pages share the app shell;
 * ops pages add their tabs. Separate from {@link Router} so tests can mount it in a memory router.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={routes.home()} element={<Navigate to={routes.ops.exceptions()} replace />} />
      <Route element={<AppLayout />}>
        <Route element={<OpsLayout />}>
          <Route path={routes.ops.exceptions()} element={<OpsExceptionsPage />} />
          <Route path={routes.ops.exception(':shipmentId')} element={<OpsExceptionsPage />} />
          <Route path={routes.ops.shipments()} element={<OpsShipmentsPage />} />
          <Route path={routes.ops.shipment(':shipmentId')} element={<OpsShipmentPage />} />
        </Route>
        <Route path={routes.customer.shipments(':customerId')} element={<CustomerShipmentsPage />} />
        <Route path={routes.customer.shipment(':customerId', ':shipmentId')} element={<CustomerShipmentsPage />} />
      </Route>
      <Route
        path="*"
        element={(
          <StandalonePageLayout>
            <NotFoundPage />
          </StandalonePageLayout>
        )}
      />
    </Routes>
  )
}

/** Browser entry of the SPA: wraps {@link AppRoutes} in a `BrowserRouter`. */
export function Router() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
