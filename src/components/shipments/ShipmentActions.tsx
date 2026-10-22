import { useId } from 'react'
import { Link } from 'react-router'
import { useIntl, type IntlShape } from 'react-intl'
import { toast } from 'sonner'
import {
  Copy,
  FileText,
  Inbox,
  MessageSquare,
  Phone,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { ShipmentActionId, ShipmentActionsModel } from '@/lib/shipmentDetailState'
import { CONFIDENCE_THRESHOLD, STALE_AFTER_HOURS } from '@/lib/thresholds'
import { cn } from '@/lib/utils'

export type ShipmentActionsProps = {
  /** Note and actions chosen by `buildShipmentActions`. */
  model: ShipmentActionsModel
  /** Carrier named in the carrier actions: the source of the ETA. */
  carrierName: string
  customerName: string
  /** Exception detail in the exceptions inbox, for the actions that lead there. */
  inboxHref: string
  className?: string
}

type ActionPresentation = {
  icon: LucideIcon
  /** Stays an outline button unless the action is the one to take next. */
  isPrimary: boolean
}

const ACTION_PRESENTATION = {
  contactCarrier: { icon: Phone, isPrimary: false },
  messageCustomer: { icon: MessageSquare, isPrimary: false },
  copyTrackingLink: { icon: Copy, isPrimary: false },
  askCarrierToConfirm: { icon: Sparkles, isPrimary: false },
  askNewSlot: { icon: Timer, isPrimary: false },
  reviewDraft: { icon: FileText, isPrimary: true },
  openInbox: { icon: Inbox, isPrimary: false },
} satisfies Record<ShipmentActionId, ActionPresentation>

const buttonClassName = 'h-auto min-h-9 w-full justify-start py-1.5 text-start whitespace-normal'

type ActionsNoteValues = { threshold: number, hours: number }

function formatNote(intl: IntlShape, note: ShipmentActionsModel['note']): string {
  const values: ActionsNoteValues = { threshold: CONFIDENCE_THRESHOLD, hours: STALE_AFTER_HOURS }
  return intl.formatMessage({ id: `shipmentActions.note.${note}` }, values)
}

type SimulatedActionId = Exclude<ShipmentActionId, 'reviewDraft' | 'openInbox'>

function isSimulatedAction(actionId: ShipmentActionId): actionId is SimulatedActionId {
  return actionId !== 'reviewDraft' && actionId !== 'openInbox'
}

/**
 * Actions card of the ops shipment detail: a note that says whether anything needs attention
 * followed by the actions. Everything is simulated in this prototype: the contact and message
 * actions only confirm with a toast, nothing is sent or copied. The two actions that lead to the
 * exception (review the AI draft, open the inbox) are real links. The AI never acts alone: even the
 * suggested "Ask carrier to confirm" waits for the click.
 */
export function ShipmentActions({ model, carrierName, customerName, inboxHref, className }: ShipmentActionsProps) {
  const intl = useIntl()
  const headingId = useId()

  function renderAction(actionId: ShipmentActionId) {
    const { icon: Icon, isPrimary } = ACTION_PRESENTATION[actionId]
    const label = intl.formatMessage({ id: `shipmentActions.${actionId}` }, { carrier: carrierName })
    const variant = isPrimary ? 'default' : 'outline'

    if (!isSimulatedAction(actionId)) {
      return (
        <Button key={actionId} asChild variant={variant} size="lg" className={buttonClassName}>
          <Link to={inboxHref}>
            <Icon aria-hidden="true" />
            {label}
          </Link>
        </Button>
      )
    }

    return (
      <Button
        key={actionId}
        variant={variant}
        size="lg"
        className={buttonClassName}
        onClick={() => toast.success(intl.formatMessage(
          { id: `shipmentActions.${actionId}Done` },
          { carrier: carrierName, customer: customerName },
        ))}
      >
        <Icon aria-hidden="true" />
        {label}
      </Button>
    )
  }

  return (
    <Card className={cn('px-5', className)}>
      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        <h2 id={headingId} className="text-base font-semibold">
          {intl.formatMessage({ id: 'shipmentActions.title' })}
        </h2>
        <p className="text-sm text-muted-foreground">{formatNote(intl, model.note)}</p>
        <div className="flex flex-col gap-2">{model.actions.map(renderAction)}</div>
      </section>
    </Card>
  )
}
