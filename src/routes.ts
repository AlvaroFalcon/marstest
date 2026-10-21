/**
 * Typed helpers for every path of the application (MarsBased React guidelines §3.5.2).
 * Use them in `<Link to={routes.home()}>` and in `Router.tsx`; never hard-code a path elsewhere.
 * Pass `':shipmentId'` / `':customerId'` to build the route patterns used by `Router.tsx`.
 */
export default {
  home: () => `/`,
  ops: {
    exceptions: () => `/ops/exceptions`,
    exception: (shipmentId: string) => `/ops/exceptions/${shipmentId}`,
    shipments: () => `/ops/shipments`,
    shipment: (shipmentId: string) => `/ops/shipments/${shipmentId}`,
  },
  customer: {
    shipments: (customerId: string) => `/customers/${customerId}/shipments`,
    shipment: (customerId: string, shipmentId: string) => `/customers/${customerId}/shipments/${shipmentId}`,
  },
}
