import { Link } from 'react-router'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { OpsTabCount } from '@/lib/opsTabCounts'

export type OpsTabsProps = {
  exceptionsHref: string
  shipmentsHref: string
  active: 'exceptions' | 'shipments'
  exceptionCount: OpsTabCount
  shipmentCount: OpsTabCount
  className?: string
}

type TabCountProps = {
  count: OpsTabCount
  tone: 'danger' | 'neutral'
}

function TabCount({ count, tone }: TabCountProps) {
  const intl = useIntl()

  if (count.status === 'error') return null
  if (count.status === 'loading') {
    return (
      <Skeleton className="h-5 w-6 rounded-full">
        <span className="sr-only">{intl.formatMessage({ id: 'opsTabs.loadingCount' })}</span>
      </Skeleton>
    )
  }

  return (
    <span
      className={cn(
        'rounded-full px-1.5 text-sm tabular-nums',
        tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground',
      )}
    >
      {intl.formatNumber(count.value)}
    </span>
  )
}

const tabClassName = `
  flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground outline-hidden
  transition-colors
  focus-visible:ring-3 focus-visible:ring-ring/50
  aria-[current=page]:bg-card aria-[current=page]:font-semibold aria-[current=page]:text-foreground
  @xl:flex-none @xl:justify-start @xl:rounded-none @xl:border-b-2 @xl:border-transparent @xl:px-0 @xl:pt-2 @xl:pb-3
  @xl:text-base
  @xl:aria-[current=page]:border-info @xl:aria-[current=page]:bg-transparent
`

/**
 * Navigation of the ops area ("Exceptions" and "All shipments"). The same links render as a
 * full-width segmented bar in narrow containers and as underline tabs in wide ones. They are
 * real links (navigation is by URL), so the active one is flagged with `aria-current="page"`
 * and the counts are part of each link's accessible name. A count that fails to load is
 * omitted rather than shown as a wrong number.
 */
export function OpsTabs({
  exceptionsHref,
  shipmentsHref,
  active,
  exceptionCount,
  shipmentCount,
  className,
}: OpsTabsProps) {
  const intl = useIntl()

  return (
    <div className={cn(`
      @container px-4 pt-4
      @xl:p-0
    `, className)}
    >
      <nav
        aria-label={intl.formatMessage({ id: 'opsTabs.label' })}
        className="
          flex gap-1 rounded-lg bg-muted p-1
          @xl:gap-8 @xl:rounded-none @xl:border-b @xl:bg-card @xl:px-10 @xl:py-0
        "
      >
        <Link
          to={exceptionsHref}
          className={tabClassName}
          aria-current={active === 'exceptions' ? 'page' : undefined}
        >
          {intl.formatMessage({ id: 'opsTabs.exceptions' })}
          {/* The space between label and count is invisible in the flex row, but makes the accessible name read "Exceptions 5". */}
          {' '}
          <TabCount count={exceptionCount} tone="danger" />
        </Link>
        <Link
          to={shipmentsHref}
          className={tabClassName}
          aria-current={active === 'shipments' ? 'page' : undefined}
        >
          {intl.formatMessage({ id: 'opsTabs.shipments' })}
          {' '}
          <TabCount count={shipmentCount} tone="neutral" />
        </Link>
      </nav>
    </div>
  )
}
