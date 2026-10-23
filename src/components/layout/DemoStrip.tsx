import type { ReactNode } from 'react'
import { Loader2Icon, PresentationIcon, RotateCcwIcon, ZapIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'

export type DemoStripProps = {
  onResetDemo: () => void
  /** True while the reset is running: the button is disabled and shows a spinner. */
  isResetting: boolean
  onSimulateCarrierEvent: () => void
  /** True while the simulated event is being applied: the button is disabled and flagged busy. */
  isSimulating: boolean
  className?: string
}

type BusyIconProps = {
  isBusy: boolean
  /** Icon shown while the action is idle. */
  children: ReactNode
}

function BusyIcon({ isBusy, children }: BusyIconProps) {
  if (isBusy) {
    return <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />
  }

  return children
}

/**
 * Grey strip above the brand bar that tells the viewer this is synthetic data and hosts the
 * demo controls (simulate event, reset, theme). Labels collapse responsively through container
 * queries: "Reset demo" becomes an icon-only button and texts shorten in narrow containers.
 * Must be rendered inside an `@container` ancestor.
 */
export function DemoStrip({ onResetDemo, isResetting, onSimulateCarrierEvent, isSimulating, className }: DemoStripProps) {
  const intl = useIntl()

  return (
    <div className={cn(`
      flex items-center justify-between gap-3 bg-muted px-4 py-2
      @xl:px-10 @xl:py-2.5
    `, className)}
    >
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <PresentationIcon
          aria-hidden="true"
          className="
            hidden size-4 shrink-0
            @xl:block
          "
        />
        <span className="@xl:hidden">{intl.formatMessage({ id: 'demo.bannerShort' })}</span>
        <span className="
          hidden
          @xl:inline
        "
        >
          {intl.formatMessage({ id: 'demo.banner' })}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSimulating}
          aria-busy={isSimulating}
          onClick={onSimulateCarrierEvent}
        >
          <BusyIcon isBusy={isSimulating}>
            <ZapIcon aria-hidden="true" />
          </BusyIcon>
          <span className="@xl:hidden">{intl.formatMessage({ id: 'demo.simulateShort' })}</span>
          <span className="
            hidden
            @xl:inline
          "
          >
            {intl.formatMessage({ id: 'demo.simulate' })}
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isResetting}
          aria-busy={isResetting}
          aria-label={intl.formatMessage({ id: 'demo.reset' })}
          onClick={onResetDemo}
        >
          <BusyIcon isBusy={isResetting}>
            <RotateCcwIcon aria-hidden="true" className="@xl:hidden" />
          </BusyIcon>
          <span className="
            hidden
            @xl:inline
          "
          >
            {intl.formatMessage({ id: 'demo.reset' })}
          </span>
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}
