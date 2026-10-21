import { Link } from 'react-router'
import { useIntl } from 'react-intl'
import { ArrowLeft, MousePointerClick } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ExceptionsDetailPlaceholderProps = {
  /** True when the URL names an exception: the text then says the detail is coming instead of asking to select one. */
  hasSelection: boolean
  /** Inbox URL (with its search string). Passed only on narrow layouts, where the detail replaces the list. */
  backHref?: string
  className?: string
}

/**
 * Stand-in for the exception detail panel until the detail screen exists. It never reveals whether
 * the id is valid (unknown and out-of-scope ids look the same). On narrow layouts the page passes
 * `backHref` so the user can return to the list, since the list is not shown next to it there.
 */
export function ExceptionsDetailPlaceholder({ hasSelection, backHref, className }: ExceptionsDetailPlaceholderProps) {
  const intl = useIntl()

  return (
    <Card className={cn('items-center justify-center gap-3 p-8 text-center', className)}>
      {backHref !== undefined && (
        <Link
          to={backHref}
          className="
            inline-flex items-center gap-1.5 self-start rounded-md text-sm text-muted-foreground outline-hidden
            hover:text-foreground
            focus-visible:ring-3 focus-visible:ring-ring/50
          "
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {intl.formatMessage({ id: 'exceptionsDetail.back' })}
        </Link>
      )}
      <MousePointerClick aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-base font-medium">
        {intl.formatMessage({ id: hasSelection ? 'exceptionsDetail.comingNext' : 'exceptionsDetail.select' })}
      </p>
    </Card>
  )
}
