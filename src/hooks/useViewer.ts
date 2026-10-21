import { useMatch } from 'react-router'
import routes from '@/routes'

/** Tab of the ops area the current path belongs to. */
export type OpsTab = 'exceptions' | 'shipments'

/** The viewer derived from the URL; ops also carry the active tab for the ops navigation. */
export type RoutedViewer
  = | { role: 'ops', tab: OpsTab }
    | { role: 'customer', customerId: string }

/**
 * Derives who is looking from the path, which is the single source of truth for the role:
 * `/customers/:customerId/...` is that customer, everything else is the ops user.
 */
export function useViewer(): RoutedViewer {
  const customerMatch = useMatch({ path: routes.customer.shipments(':customerId'), end: false })
  const opsShipmentsMatch = useMatch({ path: routes.ops.shipments(), end: false })

  if (customerMatch?.params.customerId) {
    return { role: 'customer', customerId: customerMatch.params.customerId }
  }

  return { role: 'ops', tab: opsShipmentsMatch ? 'shipments' : 'exceptions' }
}
