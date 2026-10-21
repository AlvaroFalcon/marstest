import { Outlet } from 'react-router'
import { PageGutter } from '@/components/layout/PageGutter'
import { OpsTabs } from '@/components/layout/OpsTabs'
import { useOpsTabCounts } from '@/hooks/useOpsTabCounts'
import { useViewer } from '@/hooks/useViewer'
import routes from '@/routes'

/** Wraps the ops pages with their "Exceptions / All shipments" tabs and live counts. */
export function OpsLayout() {
  const viewer = useViewer()
  const { exceptionCount, shipmentCount } = useOpsTabCounts()
  const activeTab = viewer.role === 'ops' ? viewer.tab : 'exceptions'

  return (
    <>
      <OpsTabs
        exceptionsHref={routes.ops.exceptions()}
        shipmentsHref={routes.ops.shipments()}
        active={activeTab}
        exceptionCount={exceptionCount}
        shipmentCount={shipmentCount}
      />
      <PageGutter>
        <Outlet />
      </PageGutter>
    </>
  )
}
