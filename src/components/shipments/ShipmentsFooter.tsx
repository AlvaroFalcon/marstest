import { useIntl } from 'react-intl'
import { ShipmentsPagination } from './ShipmentsPagination'

export type ShipmentsFooterProps = {
  /** Rows on the current page ("N"). */
  shownCount: number
  /** Rows matching the filters across all pages ("M"). */
  totalCount: number
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

/** Footer of the list: "Showing N of M" on the left and the pagination on the right. Needs an `@container` ancestor. */
export function ShipmentsFooter({ shownCount, totalCount, page, pageCount, onPageChange }: ShipmentsFooterProps) {
  const intl = useIntl()

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {intl.formatMessage({ id: 'shipmentList.showing' }, { shown: shownCount, total: totalCount })}
      </p>
      <ShipmentsPagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
    </div>
  )
}
