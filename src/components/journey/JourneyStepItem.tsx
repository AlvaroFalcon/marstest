import type { ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { useIntl } from 'react-intl'
import type { JourneyStep } from '@/lib/journey'
import { cn } from '@/lib/utils'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import {
  JourneyConnectorChevron,
  JourneyConnectorLabel,
  JourneyConnectorLine,
} from './JourneyConnector'
import { formatConnectorLabel, formatStepSubline, getStepBadgeKind } from './formatJourney'
import { STEP_ICONS, getStepIcon } from './stepIcon'

const nodeVariants = cva(
  `
    flex size-journey-node shrink-0 items-center justify-center rounded-full border-2
    journey-row:size-journey-node-wide
  `,
  {
    variants: {
      state: {
        done: 'border-success bg-success text-success-foreground',
        problem: 'border-destructive bg-destructive-subtle text-destructive',
        upcoming: 'border-info bg-card text-info',
      },
    },
  },
)

const titleVariants = cva(`
  text-sm font-semibold text-balance
  journey-row:text-base
`, {
  variants: {
    state: {
      done: 'text-foreground',
      problem: 'text-destructive',
      upcoming: 'text-foreground',
    },
  },
})

const BODY_CLASS_NAME = `
  flex w-full min-w-0 gap-3 rounded-lg text-left
  journey-row:flex-col journey-row:items-center journey-row:gap-5 journey-row:px-2 journey-row:text-center
`

type StepBodyProps = {
  /** When set, the body is a button that calls it; otherwise a plain block. */
  onSelect?: () => void
  children: ReactNode
}

function StepBody({ onSelect, children }: StepBodyProps) {
  if (!onSelect) return <div className={BODY_CLASS_NAME}>{children}</div>

  return (
    <button
      className={cn(
        BODY_CLASS_NAME,
        `
          cursor-pointer outline-hidden
          hover:bg-muted
          focus-visible:ring-3 focus-visible:ring-ring
        `,
      )}
      type="button"
      onClick={onSelect}
    >
      {children}
    </button>
  )
}

export type JourneyStepItemProps = {
  step: JourneyStep
  /** Carrier display names by id, resolved by the parent from the reference data. */
  carrierNames: Readonly<Record<string, string>>
  /** Called with the step when it is selected; steps without raw events never become buttons. */
  onStepSelect?: (step: JourneyStep) => void
  className?: string
}

/**
 * One node of the journey with its title, status and date line, optional provenance badge and the
 * leg connector that leads to the next node. A single DOM serves both layouts (the `journey-row`
 * variant switches it), so assistive technology never meets duplicated steps. The state is
 * written for screen readers and the node icon is decorative, so colour is never the only signal.
 */
export function JourneyStepItem({ step, carrierNames, onStepSelect, className }: JourneyStepItemProps) {
  const intl = useIntl()
  const Icon = STEP_ICONS[getStepIcon(step)]
  const subline = formatStepSubline(intl, step)
  const badgeKind = getStepBadgeKind(step.provenance)
  const { connectorToNext } = step
  const isSelectable = onStepSelect !== undefined && step.rawEventIds.length > 0

  return (
    <li
      className={cn(
        `
          relative flex min-w-0 flex-col pb-6
          last:pb-0
          journey-row:flex-1 journey-row:basis-0 journey-row:pb-0
        `,
        className,
      )}
      data-state={step.state}
    >
      {connectorToNext ? <JourneyConnectorLine state={connectorToNext.state} /> : null}
      <StepBody onSelect={isSelectable ? () => onStepSelect(step) : undefined}>
        <span className={nodeVariants({ state: step.state })}>
          <Icon
            aria-hidden
            className="
              size-3.5
              journey-row:size-6
            "
          />
        </span>
        <span className="
          flex min-w-0 flex-col items-start gap-1
          journey-row:items-center
        "
        >
          <span className="sr-only">{intl.formatMessage({ id: `journey.state.${step.state}` })}</span>
          <span className={titleVariants({ state: step.state })}>{step.place}</span>
          {subline === '' ? null : <span className="text-caption text-muted-foreground">{subline}</span>}
          {badgeKind ? <ProvenanceBadge kind={badgeKind} /> : null}
        </span>
      </StepBody>
      {connectorToNext
        ? (
            <>
              <JourneyConnectorChevron state={connectorToNext.state} />
              <JourneyConnectorLabel
                label={formatConnectorLabel(intl, connectorToNext, carrierNames)}
                mode={connectorToNext.mode}
              />
            </>
          )
        : null}
    </li>
  )
}
