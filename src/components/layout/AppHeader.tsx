import { PackageIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'
import { DemoStrip } from './DemoStrip'
import { ViewerSelect, type ViewerOption } from './ViewerSelect'

export type AppHeaderProps = {
  viewerOptions: ViewerOption[]
  /** The `value` of the viewer currently selected. */
  selectedViewer: string
  onViewerChange: (value: string) => void
  onResetDemo: () => void
  isResetting: boolean
  onSimulateCarrierEvent: () => void
  /** True while the simulated event is being applied: the button is disabled and flagged busy. */
  isSimulating: boolean
  className?: string
}

/**
 * Application header: grey demo strip (synthetic-data notice, simulate, reset, theme) and a
 * brand bar with the "Viewing as" role switch. It is its own size container, so desktop and
 * mobile layouts follow the space it gets rather than the viewport.
 */
export function AppHeader({
  viewerOptions,
  selectedViewer,
  onViewerChange,
  onResetDemo,
  isResetting,
  onSimulateCarrierEvent,
  isSimulating,
  className,
}: AppHeaderProps) {
  const intl = useIntl()

  return (
    <header className={cn('@container', className)}>
      <DemoStrip
        onResetDemo={onResetDemo}
        isResetting={isResetting}
        onSimulateCarrierEvent={onSimulateCarrierEvent}
        isSimulating={isSimulating}
      />
      <div className="
        flex items-center justify-between gap-3 border-b bg-card px-4 py-3
        @xl:px-10 @xl:py-4
      "
      >
        <div className="flex items-center gap-3">
          <PackageIcon
            aria-hidden="true"
            className="
              size-5 shrink-0 text-info
              @xl:size-6
            "
          />
          <span className="
            text-lg font-semibold
            @max-xl:sr-only
          "
          >
            {intl.formatMessage({ id: 'shell.brand' })}
          </span>
        </div>
        <ViewerSelect options={viewerOptions} value={selectedViewer} onValueChange={onViewerChange} />
      </div>
    </header>
  )
}
