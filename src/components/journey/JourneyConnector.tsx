import { ChevronRight, Ship, Truck } from 'lucide-react'
import { cva } from 'class-variance-authority'
import type { JourneyConnector as JourneyConnectorData } from '@/lib/journey'
import { cn } from '@/lib/utils'

const connectorLineVariants = cva(
  `
    absolute top-journey-node bottom-0 left-[calc(var(--spacing-journey-node)/2-1px)] w-0.5
    journey-row:top-[calc(var(--spacing-journey-node-wide)/2-1px)] journey-row:bottom-auto
    journey-row:left-[calc(50%+var(--spacing-journey-node-wide)/2)] journey-row:h-0.5
    journey-row:w-[calc(100%-var(--spacing-journey-node-wide)-1rem)]
  `,
  {
    variants: {
      state: { done: 'bg-success', upcoming: 'bg-border' },
    },
  },
)

export type JourneyConnectorLineProps = {
  state: JourneyConnectorData['state']
  className?: string
}

/**
 * Decorative line from one node to the next: green when the next node was reached, grey otherwise.
 * Render it before the node in the DOM so the node paints over its end. The state is also in the
 * text of the nodes it joins, so hiding it from assistive technology loses nothing.
 */
export function JourneyConnectorLine({ state, className }: JourneyConnectorLineProps) {
  return <span aria-hidden className={cn(connectorLineVariants({ state }), className)} />
}

export type JourneyConnectorChevronProps = {
  state: JourneyConnectorData['state']
  className?: string
}

/** Arrow head at the end of the horizontal connector; hidden in the vertical timeline, where the line reads top to bottom. */
export function JourneyConnectorChevron({ state, className }: JourneyConnectorChevronProps) {
  return (
    <ChevronRight
      aria-hidden
      className={cn(
        `
          hidden
          journey-row:absolute journey-row:top-[calc(var(--spacing-journey-node-wide)/2-0.5rem)]
          journey-row:left-[calc(150%-var(--spacing-journey-node-wide)/2-1rem)] journey-row:block journey-row:size-4
        `,
        state === 'done' ? 'text-success' : 'text-muted-foreground',
        className,
      )}
    />
  )
}

export type JourneyConnectorLabelProps = {
  mode: JourneyConnectorData['mode']
  /** Already formatted "Mode · Carrier" text. */
  label: string
  className?: string
}

/**
 * Mode icon plus "Road · Transauto" text. Under the step title in the vertical timeline, centred
 * under the horizontal connector otherwise.
 */
export function JourneyConnectorLabel({ mode, label, className }: JourneyConnectorLabelProps) {
  const Icon = mode === 'sea' ? Ship : Truck

  return (
    <p
      className={cn(
        `
          flex items-center gap-1.5 pt-1 pl-[calc(var(--spacing-journey-node)+0.75rem)] text-caption
          text-muted-foreground
          journey-row:absolute journey-row:top-[calc(var(--spacing-journey-node-wide)/2+0.25rem)]
          journey-row:left-[calc(50%+var(--spacing-journey-node-wide)/2)] journey-row:block
          journey-row:w-[calc(100%-var(--spacing-journey-node-wide))] journey-row:p-0 journey-row:text-center
          journey-row:text-balance
        `,
        className,
      )}
    >
      <Icon
        aria-hidden
        className="
          size-3.5 shrink-0
          journey-row:mr-1 journey-row:inline-block journey-row:align-text-bottom
        "
      />
      {label}
    </p>
  )
}
