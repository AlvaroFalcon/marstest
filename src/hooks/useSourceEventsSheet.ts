import { useRef, useState, type RefObject } from 'react'
import { useExceptionsSearchParams } from '@/hooks/useExceptionsSearchParams'

/** Result of {@link useSourceEventsSheet}. */
export type UseSourceEventsSheetResult = {
  /** Ref for the detail title: focus goes there when the sheet closes and its opener is gone. */
  titleRef: RefObject<HTMLHeadingElement | null>
  /** True when the URL asks for the sheet to be open (`?events=open`). */
  isOpen: boolean
  /** Raw event ids of the journey step that opened the sheet; empty when opened from the AI evidence. */
  highlightedEventIds: readonly string[]
  /** Opens the sheet, optionally highlighting the events of a journey step. */
  open: (highlightEventIds?: readonly string[]) => void
  /** For the sheet's `onOpenChange`: closing clears the highlight and removes the URL param. */
  onOpenChange: (isOpen: boolean) => void
  /** For the sheet's `onCloseAutoFocus`: returns focus to the control that opened it. */
  onCloseAutoFocus: (event: Event) => void
}

/**
 * State of the source events sheet of one shipment detail, shared by the exception and the
 * shipment screens: open state in the URL, highlighted events in local state, and focus handling.
 *
 * Why the focus code lives here: the sheet has no `SheetTrigger` (its state is in the URL), so
 * Radix has nothing to return focus to. Focus goes back to the control that opened it (captured
 * when opening); when there is none (opened from the URL) or it left the page, it goes to the
 * title instead of being lost on the body.
 */
export function useSourceEventsSheet(): UseSourceEventsSheetResult {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [highlightedEventIds, setHighlightedEventIds] = useState<readonly string[]>([])
  const { isSourceEventsOpen, openSourceEvents, closeSourceEvents } = useExceptionsSearchParams(null)

  function open(highlightEventIds: readonly string[] = []): void {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setHighlightedEventIds(highlightEventIds)
    openSourceEvents()
  }

  function onOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      setHighlightedEventIds([])
      closeSourceEvents()
    }
  }

  function onCloseAutoFocus(event: Event): void {
    event.preventDefault()
    const opener = openerRef.current
    openerRef.current = null
    if (opener?.isConnected) {
      opener.focus()
    }
    else {
      titleRef.current?.focus()
    }
  }

  return { titleRef, isOpen: isSourceEventsOpen, highlightedEventIds, open, onOpenChange, onCloseAutoFocus }
}
