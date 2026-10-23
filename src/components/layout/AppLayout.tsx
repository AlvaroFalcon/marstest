import { Outlet } from 'react-router'
import { AppHeader } from '@/components/layout/AppHeader'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useResetDemo } from '@/hooks/useResetDemo'
import { useSimulateCarrierEvent } from '@/hooks/useSimulateCarrierEvent'
import { useViewerSwitch } from '@/hooks/useViewerSwitch'

/** Shell shared by every page: the header with the demo controls and role switch, then the page. */
export function AppLayout() {
  const { viewerOptions, selectedViewer, onViewerChange } = useViewerSwitch()
  const resetDemo = useResetDemo()
  const simulateCarrierEvent = useSimulateCarrierEvent()

  return (
    <div className="@container flex min-h-svh flex-col">
      <AppHeader
        viewerOptions={viewerOptions}
        selectedViewer={selectedViewer}
        onViewerChange={onViewerChange}
        onResetDemo={() => resetDemo.mutate()}
        isResetting={resetDemo.isPending}
        onSimulateCarrierEvent={() => simulateCarrierEvent.mutate()}
        isSimulating={simulateCarrierEvent.isPending}
        notificationSlot={<NotificationCenter />}
      />
      <Outlet />
    </div>
  )
}
