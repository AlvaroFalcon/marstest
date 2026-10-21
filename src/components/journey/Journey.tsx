import { useIntl } from 'react-intl'
import type { Shipment } from '@/api/types'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { buildJourney, type JourneyStep } from '@/lib/journey'
import { cn } from '@/lib/utils'
import { JourneyStepItem } from './JourneyStepItem'

/** Journeys with more steps than this need a wider card before they lay out horizontally. */
const MAX_STEPS_FOR_REGULAR_DENSITY = 5

export type JourneyProps = {
  shipment: Shipment
  /** Injected clock: decides which planned dates are overdue. */
  now: Date
  /** Carrier display names by id, resolved by the parent from the reference data. */
  carrierNames: Readonly<Record<string, string>>
  /**
   * Makes steps with source events keyboard-focusable buttons (ops opens the raw events) and shows
   * the "Click / Tap a step" hint. Customers pass nothing and see no hint.
   */
  onStepSelect?: (step: JourneyStep) => void
  className?: string
}

/**
 * Card with the route of a shipment as arrow-linked nodes (ADR 0024). Wide cards lay the nodes out
 * in a row with the leg label under each arrow; narrow ones (and journeys with many steps, which
 * need more room) use a vertical timeline, so there is never a horizontal scroll. Done nodes are
 * filled green, the stuck one has a red outline and title, upcoming ones a blue outline; future
 * dates carry an "Estimated" or "Carrier ETA" badge so a forecast never reads as a fact.
 */
export function Journey({ shipment, now, carrierNames, onStepSelect, className }: JourneyProps) {
  const intl = useIntl()
  const steps = buildJourney(shipment, now)
  const density = steps.length > MAX_STEPS_FOR_REGULAR_DENSITY ? 'dense' : 'regular'

  return (
    <Card className={cn('@container/journey', className)} data-density={density}>
      <CardHeader>
        <h2 className="text-base font-semibold">{intl.formatMessage({ id: 'journey.title' })}</h2>
        {onStepSelect
          ? (
              <CardDescription>
                {/* Both texts are in the DOM; the container query hides one so only one is announced. */}
                <span className="journey-row:hidden">{intl.formatMessage({ id: 'journey.hint.tap' })}</span>
                <span className="
                  hidden
                  journey-row:inline
                "
                >
                  {intl.formatMessage({ id: 'journey.hint.click' })}
                </span>
              </CardDescription>
            )
          : null}
      </CardHeader>
      <CardContent>
        <ol
          aria-label={intl.formatMessage({ id: 'journey.listLabel' })}
          className="
            flex flex-col
            journey-row:flex-row
          "
        >
          {steps.map(step => (
            <JourneyStepItem key={step.id} carrierNames={carrierNames} step={step} onStepSelect={onStepSelect} />
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
