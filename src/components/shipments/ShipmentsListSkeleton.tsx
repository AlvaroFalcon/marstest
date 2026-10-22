import { useIntl } from 'react-intl'
import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder rows while the shipments load; announced once as a status instead of per row. */
export function ShipmentsListSkeleton() {
  const intl = useIntl()

  return (
    <div role="status" className="flex flex-col gap-2">
      <span className="sr-only">{intl.formatMessage({ id: 'shipmentList.loading' })}</span>
      <Skeleton aria-hidden="true" className="h-20 rounded-xl" />
      <Skeleton aria-hidden="true" className="h-20 rounded-xl" />
      <Skeleton aria-hidden="true" className="h-20 rounded-xl" />
      <Skeleton aria-hidden="true" className="h-20 rounded-xl" />
    </div>
  )
}
