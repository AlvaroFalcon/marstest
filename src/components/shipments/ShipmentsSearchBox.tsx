import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Milliseconds the user must stop typing before the search is applied to the URL. */
export const SEARCH_DEBOUNCE_MS = 300

export type ShipmentsSearchBoxProps = {
  /** Search text currently applied (from the URL). */
  value: string
  /** Called with the typed text once the user pauses for {@link SEARCH_DEBOUNCE_MS}. */
  onSearch: (search: string) => void
  className?: string
}

/**
 * Search field of the shipments list. The input keeps what the user types in local state and only
 * reports it after a pause, so each keystroke neither re-filters nor rewrites the URL. When the
 * applied value changes from outside (clear filters, Back) the text follows it.
 */
export function ShipmentsSearchBox({ value, onSearch, className }: ShipmentsSearchBoxProps) {
  const intl = useIntl()
  const [draft, setDraft] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)

  if (value !== previousValue) {
    setPreviousValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft.trim() === value) {
      return
    }
    const timeoutId = setTimeout(() => onSearch(draft), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [draft, value, onSearch])

  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        aria-label={intl.formatMessage({ id: 'shipmentList.search.label' })}
        placeholder={intl.formatMessage({ id: 'shipmentList.search.placeholder' })}
        className="h-9 pl-8"
      />
    </div>
  )
}
