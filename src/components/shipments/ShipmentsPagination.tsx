import { useIntl } from 'react-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { range } from 'es-toolkit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ShipmentsPaginationProps = {
  /** Current one-based page. */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Previous / next buttons with the page numbers in between. In narrow containers the numbers give
 * way to "Page 1 of 2" so the control never overflows. Needs an `@container` ancestor. The current
 * page is flagged with `aria-current="page"`.
 */
export function ShipmentsPagination({ page, pageCount, onPageChange, className }: ShipmentsPaginationProps) {
  const intl = useIntl()

  return (
    <nav
      aria-label={intl.formatMessage({ id: 'shipmentList.pagination.label' })}
      className={cn(`flex items-center gap-1`, className)}
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        aria-label={intl.formatMessage({ id: 'shipmentList.pagination.previous' })}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="
        px-2 text-sm text-muted-foreground
        @md:hidden
      "
      >
        {intl.formatMessage({ id: 'shipmentList.pagination.summary' }, { page, pageCount })}
      </span>
      <ul className="
        hidden items-center gap-1
        @md:flex
      "
      >
        {range(1, pageCount + 1).map(pageNumber => (
          <li key={pageNumber}>
            <Button
              variant={pageNumber === page ? 'secondary' : 'ghost'}
              size="icon"
              aria-current={pageNumber === page ? 'page' : undefined}
              aria-label={intl.formatMessage({ id: 'shipmentList.pagination.page' }, { page: pageNumber })}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= pageCount}
        aria-label={intl.formatMessage({ id: 'shipmentList.pagination.next' })}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
