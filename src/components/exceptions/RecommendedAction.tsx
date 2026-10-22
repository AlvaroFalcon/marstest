import { useId, useState } from 'react'
import { useIntl, type IntlShape } from 'react-intl'
import { toast } from 'sonner'
import { CircleAlert, CircleCheck, Loader2, Mail, Send, ShieldCheck, Sparkles, Upload } from 'lucide-react'
import type { ShipmentException } from '@/api/types'
import { formatElapsedTime } from '@/components/provenance/formatProvenance'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useApproveDraft } from '@/hooks/useApproveDraft'
import { useDiscardDraft } from '@/hooks/useDiscardDraft'
import { getElapsedTime } from '@/lib/provenance'
import { cn } from '@/lib/utils'

export type RecommendedActionProps = {
  shipmentId: string
  /** The exception the panel shows; the parent keys this component by its id so local text never leaks between exceptions. */
  exception: ShipmentException
  /** Customer display name, resolved by the parent. */
  customerName: string
  /** True when the shipment is held for a missing certificate of origin, so the manual actions apply. */
  offerCertificateActions: boolean
  /** Injected clock for the "notified 2 h ago" line. */
  now: Date
  /** Called after a discard that removes the whole section, so the parent can place focus outside it. */
  onSectionRemoved: () => void
  className?: string
}

/** Callback ref that moves focus to the element when it mounts, so a handled action never drops focus to the page body. */
function focusOnMount(node: HTMLElement | null): void {
  node?.focus()
}

type ApproveMutation = ReturnType<typeof useApproveDraft>
type DiscardMutation = ReturnType<typeof useDiscardDraft>

const wrappingButtonClassName = 'h-auto min-h-9 w-full py-1.5 whitespace-normal @md:w-auto'

type PendingDraftProps = {
  exceptionId: string
  initialBody: string
  customerName: string
  /**
   * Mutations are owned by the parent: a success replaces the pending draft, which unmounts this
   * component, and a mutation observer that unmounts never runs its per-call `onSuccess`.
   */
  approve: ApproveMutation
  discard: DiscardMutation
  /** Called once the mutation that removes the pending state succeeded, to place focus. */
  onHandled: (outcome: 'sent' | 'discarded') => void
}

/**
 * Editable AI draft with the approve / discard actions. The text lives in local state, keyed by the
 * exception, and survives a failed send so ops can retry. While a request is in flight both
 * buttons and the textarea are locked so nothing changes under the request.
 */
function PendingDraft({ exceptionId, initialBody, customerName, approve, discard, onHandled }: PendingDraftProps) {
  const intl = useIntl()
  const [body, setBody] = useState(initialBody)
  const messageId = useId()
  const hintId = useId()
  const noteId = useId()
  const isBusy = approve.isPending || discard.isPending
  const isEmpty = body.trim() === ''
  const describedBy = isEmpty ? `${hintId} ${noteId}` : noteId

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-5 py-4">
      <h2 className="flex items-center gap-2 text-ai-title font-semibold text-info">
        <Sparkles aria-hidden="true" className="size-4 shrink-0" />
        {intl.formatMessage({ id: 'recommendedAction.draftTitle' }, { customerName })}
      </h2>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={messageId} className="sr-only">
          {intl.formatMessage({ id: 'recommendedAction.messageLabel' })}
        </label>
        <Textarea
          id={messageId}
          value={body}
          readOnly={isBusy}
          aria-invalid={isEmpty}
          aria-describedby={describedBy}
          onChange={event => setBody(event.target.value)}
          className="min-h-24 bg-background"
        />
        {isEmpty && (
          <p id={hintId} className="text-caption text-muted-foreground">
            {intl.formatMessage({ id: 'recommendedAction.emptyHint' })}
          </p>
        )}
      </div>
      <div className="
        flex flex-col gap-3
        @md:flex-row @md:flex-wrap @md:items-center
      "
      >
        <Button
          size="lg"
          disabled={isBusy || isEmpty}
          className={wrappingButtonClassName}
          onClick={() => approve.mutate({ exceptionId, body: body.trim() }, { onSuccess: () => onHandled('sent') })}
        >
          {approve.isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
          {intl.formatMessage({ id: approve.isPending ? 'recommendedAction.sending' : 'recommendedAction.approve' })}
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={isBusy}
          className={wrappingButtonClassName}
          onClick={() => discard.mutate(exceptionId, { onSuccess: () => onHandled('discarded') })}
        >
          {discard.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          {intl.formatMessage({ id: discard.isPending ? 'recommendedAction.discarding' : 'recommendedAction.discard' })}
        </Button>
        <p id={noteId} className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
          {intl.formatMessage({ id: 'recommendedAction.note' })}
        </p>
      </div>
      {approve.isError && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {intl.formatMessage({ id: 'recommendedAction.error' })}
        </p>
      )}
      {discard.isError && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {intl.formatMessage({ id: 'recommendedAction.discardError' })}
        </p>
      )}
    </div>
  )
}

type SentDraftProps = {
  body: string
  notifiedAt: string
  now: Date
  customerName: string
  /** True right after this session sent the notice, to move focus to the status line. */
  shouldFocus: boolean
}

function formatSentTime(intl: IntlShape, notifiedAt: string, now: Date): string {
  return formatElapsedTime(intl, getElapsedTime(notifiedAt, now))
}

/** Read-only record of the notice that was sent; plain text, never a disabled field. */
function SentDraft({ body, notifiedAt, now, customerName, shouldFocus }: SentDraftProps) {
  const intl = useIntl()

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card px-5 py-4">
      <h2 className="flex items-center gap-2 text-ai-title font-semibold text-info">
        <Sparkles aria-hidden="true" className="size-4 shrink-0" />
        {intl.formatMessage({ id: 'recommendedAction.draftTitle' }, { customerName })}
      </h2>
      <p className="rounded-lg border bg-background px-2.5 py-2 text-sm whitespace-pre-wrap">{body}</p>
      <p
        ref={shouldFocus ? focusOnMount : undefined}
        tabIndex={-1}
        className="
          flex items-center gap-1.5 rounded-sm text-sm font-medium outline-hidden
          focus-visible:ring-3 focus-visible:ring-ring
        "
      >
        <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        {intl.formatMessage(
          { id: 'recommendedAction.sent' },
          { relativeTime: formatSentTime(intl, notifiedAt, now) },
        )}
      </p>
    </div>
  )
}

/**
 * Recommended action of an exception: the AI customer-notice draft that ops edits and approves,
 * plus the manual certificate actions when the shipment is held for a missing certificate of origin.
 * Nothing is sent without approval, there is no confirm dialog (the explicit button is the approval)
 * and a discarded or absent draft renders nothing. The whole section disappears when neither a
 * draft nor the manual actions apply, so the screen never shows an empty heading.
 *
 * Focus: after sending, focus moves to the "Customer notified" line; after discarding it moves to
 * the section heading when the section remains; when the section disappears entirely, the parent
 * is asked to focus the page title through `onSectionRemoved`.
 */
export function RecommendedAction({
  shipmentId,
  exception,
  customerName,
  offerCertificateActions,
  now,
  onSectionRemoved,
  className,
}: RecommendedActionProps) {
  const intl = useIntl()
  const headingId = useId()
  const [handled, setHandled] = useState<'sent' | 'discarded' | null>(null)
  const approve = useApproveDraft(shipmentId, customerName)
  const discard = useDiscardDraft(shipmentId)
  const { draft } = exception
  const hasDraftCard = draft.status === 'pending' || draft.status === 'sent'

  if (!hasDraftCard && !offerCertificateActions) {
    return null
  }

  return (
    <section aria-labelledby={headingId} className={cn('@container flex flex-col gap-3', className)}>
      <h2
        id={headingId}
        ref={handled === 'discarded' ? focusOnMount : undefined}
        tabIndex={-1}
        className="
          rounded-sm text-base font-semibold outline-hidden
          focus-visible:ring-3 focus-visible:ring-ring
        "
      >
        {intl.formatMessage({ id: 'recommendedAction.title' })}
      </h2>
      {draft.status === 'pending' && (
        <PendingDraft
          exceptionId={exception.id}
          initialBody={draft.body}
          customerName={customerName}
          approve={approve}
          discard={discard}
          onHandled={(outcome) => {
            if (outcome === 'discarded' && !offerCertificateActions) {
              onSectionRemoved()
              return
            }
            setHandled(outcome)
          }}
        />
      )}
      {draft.status === 'sent' && (
        <SentDraft
          body={draft.body}
          notifiedAt={draft.notifiedAt}
          now={now}
          customerName={customerName}
          shouldFocus={handled === 'sent'}
        />
      )}
      {offerCertificateActions && (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-muted-foreground">{intl.formatMessage({ id: 'recommendedAction.otherActions' })}</p>
          <div className="
            flex flex-col gap-2
            @md:flex-row @md:flex-wrap
          "
          >
            <Button
              size="lg"
              variant="outline"
              className={wrappingButtonClassName}
              onClick={() => toast.success(intl.formatMessage({ id: 'recommendedAction.uploadCertificateDone' }))}
            >
              <Upload aria-hidden="true" />
              {intl.formatMessage({ id: 'recommendedAction.uploadCertificate' })}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={wrappingButtonClassName}
              onClick={() => toast.success(intl.formatMessage({ id: 'recommendedAction.requestCertificateDone' }))}
            >
              <Mail aria-hidden="true" />
              {intl.formatMessage({ id: 'recommendedAction.requestCertificate' })}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
