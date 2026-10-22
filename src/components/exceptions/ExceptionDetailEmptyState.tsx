import { useIntl } from 'react-intl'
import { MousePointerClick } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ExceptionDetailEmptyStateProps = {
  className?: string
}

/** Right-hand column of the wide layout while no exception is open: asks to pick one from the inbox. */
export function ExceptionDetailEmptyState({ className }: ExceptionDetailEmptyStateProps) {
  const intl = useIntl()

  return (
    <Card className={cn('items-center justify-center gap-3 p-8 text-center', className)}>
      <MousePointerClick aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="text-base font-medium">{intl.formatMessage({ id: 'exceptionsDetail.select' })}</p>
    </Card>
  )
}
