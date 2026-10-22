import {
  Anchor, ArrowDown, CircleCheck, Clock, CornerDownRight, FileSearch, Lock, LockOpen, Package, Ship, TriangleAlert, Truck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { useIntl } from 'react-intl'
import type { MilestoneStatus } from '@/api/types'
import { formatCarrierChannel } from '@/components/provenance/formatProvenance'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { SourceEventRow } from '@/lib/sourceEvents'
import {
  formatEventMapping,
  formatEventReceivedAt,
  formatEventStatus,
  formatEventTimeDelta,
  formatLowConfidence,
} from './formatSourceEvents'

/** Icon shown next to each normalised status; the label is always printed beside it. */
const STATUS_ICONS = {
  booked: Package,
  pickedUp: Package,
  departed: Truck,
  inTransit: Truck,
  arrived: Anchor,
  loadedOnVessel: Ship,
  vesselRolled: Ship,
  customsHold: Lock,
  customsCleared: LockOpen,
  delayed: Clock,
  incident: TriangleAlert,
  outForDelivery: Truck,
  delivered: CircleCheck,
} as const satisfies Record<MilestoneStatus, LucideIcon>

export type SourceEventsSheetProps = {
  /** Controlled open state; the owner keeps it in the URL (`?events=open`). */
  isOpen: boolean
  /** Called with `false` when the user dismisses the sheet (Esc, overlay, close button). */
  onOpenChange: (isOpen: boolean) => void
  shipmentId: string
  /** Every event of the shipment, oldest first, from `buildSourceEventRows`. */
  rows: SourceEventRow[]
  /** Carrier display names by id, from the reference data. */
  carrierNames: Readonly<Record<string, string>>
  /** Ids of the events to highlight and scroll into view (events of the clicked journey step); empty for none. */
  highlightedEventIds: readonly string[]
  /** True on wide layouts (right side sheet); false renders a bottom sheet. Same switch as `SiteFilter`. */
  isDesktop: boolean
  /**
   * Forwarded to the dialog content. Radix returns focus to the control that opened the sheet; when
   * the sheet was opened from the URL there is none, so the owner calls `event.preventDefault()`
   * and focuses the detail title instead.
   */
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * Side (wide) or bottom (narrow) sheet that lists the original carrier messages of a shipment next
 * to the status each was mapped to, so ops can audit the normalisation.
 *
 * Mapping provenance is encoded three ways so colour is never the only signal: AI mappings use the
 * info colour (blue is reserved for AI content), low-confidence ones the warning colour plus a "?"
 * on the status and an explicit review sentence. Events of the clicked journey step get a ring and a
 * screen-reader cue, and the first one is scrolled into view when the sheet opens.
 */
export function SourceEventsSheet({
  isOpen,
  onOpenChange,
  shipmentId,
  rows,
  carrierNames,
  highlightedEventIds,
  isDesktop,
  onCloseAutoFocus,
}: SourceEventsSheetProps) {
  const intl = useIntl()
  const firstHighlightedId = rows.find(row => highlightedEventIds.includes(row.id))?.id

  /** Smooth scrolling only for users who have not asked for reduced motion. */
  function scrollIntoViewGently(node: HTMLElement | null) {
    if (node === null) return
    const canAnimate = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    node.scrollIntoView?.({ block: 'center', behavior: canAnimate ? 'smooth' : 'auto' })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn(
          'gap-0',
          isDesktop ? 'data-[side=right]:sm:max-w-105' : 'max-h-[85svh] rounded-t-xl',
        )}
      >
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">
            {intl.formatMessage({ id: 'sourceEvents.title' }, { shipmentId })}
          </SheetTitle>
          <SheetDescription>{intl.formatMessage({ id: 'sourceEvents.description' })}</SheetDescription>
        </SheetHeader>
        <ol
          aria-label={intl.formatMessage({ id: 'sourceEvents.listLabel' })}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
        >
          {rows.map((row) => {
            const isHighlighted = highlightedEventIds.includes(row.id)
            const isAi = row.mapping.method === 'ai'
            const StatusIcon = STATUS_ICONS[row.status]

            return (
              <li
                key={row.id}
                ref={row.id === firstHighlightedId ? scrollIntoViewGently : undefined}
                aria-current={isHighlighted || undefined}
                className="flex flex-col"
              >
                {row.deltaFromPrevious !== null && (
                  <div className="flex flex-col items-center py-1 text-xs text-muted-foreground">
                    <ArrowDown aria-hidden className="size-4" />
                    <span>{formatEventTimeDelta(intl, row.deltaFromPrevious)}</span>
                  </div>
                )}
                <article
                  data-highlighted={isHighlighted || undefined}
                  data-review={row.needsReview || undefined}
                  data-ai={(isAi && !row.needsReview) || undefined}
                  className={cn(
                    `
                      flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground
                      data-ai:border-info
                      data-highlighted:ring-2 data-highlighted:ring-ring
                      data-review:border-warning
                    `,
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-xs font-semibold tracking-wide uppercase">
                      {intl.formatMessage(
                        { id: 'sourceEvents.source' },
                        {
                          carrier: carrierNames[row.carrierId] ?? row.carrierId,
                          channel: formatCarrierChannel(intl, row.channel),
                        },
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatEventReceivedAt(intl, row.receivedAt)}</p>
                  </div>
                  {isHighlighted && <p className="sr-only">{intl.formatMessage({ id: 'sourceEvents.highlighted' })}</p>}
                  <p className="
                    rounded-md bg-muted p-2 font-mono text-xs/normal wrap-anywhere whitespace-pre-wrap
                    text-muted-foreground
                  "
                  >
                    {row.rawText}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CornerDownRight aria-hidden className="size-4 text-muted-foreground" />
                    <Badge
                      variant={row.needsReview ? 'outline' : 'secondary'}
                      className={cn(row.needsReview && 'border-warning bg-warning-subtle text-warning')}
                    >
                      <StatusIcon aria-hidden />
                      {formatEventStatus(intl, row.status, row.needsReview)}
                    </Badge>
                    <p className={cn('text-xs text-muted-foreground', isAi && 'text-info', row.needsReview && `
                      text-warning
                    `)}
                    >
                      {row.needsReview && row.mapping.method === 'ai'
                        ? formatLowConfidence(intl, row.mapping.confidence)
                        : formatEventMapping(intl, row.mapping)}
                    </p>
                  </div>
                  {row.isCited && (
                    <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <FileSearch aria-hidden className="size-3" />
                      {intl.formatMessage({ id: 'sourceEvents.cited' })}
                    </p>
                  )}
                </article>
              </li>
            )
          })}
        </ol>
      </SheetContent>
    </Sheet>
  )
}
