import { ChartLine, ClockAlert, Lock, Ship, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ExceptionType } from '@/api/types'
import type { MessageId } from '@/locales/en'

/** Visual weight of an exception: drives the badge variant and the colour of the card's left bar. */
export type ExceptionTone = 'critical' | 'warning' | 'neutral'

/** How one exception type is presented. The label is always shown next to the icon, so colour is never the only signal. */
export type ExceptionStatusPresentation = {
  tone: ExceptionTone
  icon: LucideIcon
  labelId: MessageId
}

/**
 * Presentation of each exception type (decided with the user): customs hold is the only critical
 * one, stale tracking is neutral (nothing is known to be wrong, we just lack news), the rest warn.
 */
export const EXCEPTION_STATUS_PRESENTATION = {
  customsHold: { tone: 'critical', icon: Lock, labelId: 'exceptionStatus.customsHold' },
  incident: { tone: 'warning', icon: TriangleAlert, labelId: 'exceptionStatus.incident' },
  vesselRolled: { tone: 'warning', icon: Ship, labelId: 'exceptionStatus.delayed' },
  predictedDelay: { tone: 'warning', icon: ChartLine, labelId: 'exceptionStatus.delayPredicted' },
  staleTracking: { tone: 'neutral', icon: ClockAlert, labelId: 'exceptionStatus.noUpdate' },
} satisfies Record<ExceptionType, ExceptionStatusPresentation>
