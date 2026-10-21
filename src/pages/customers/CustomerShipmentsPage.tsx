import { FormattedMessage } from 'react-intl'
import { useParams } from 'react-router'
import { PageGutter } from '@/components/layout/PageGutter'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomer } from '@/hooks/useCustomer'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Customer shipments list. Placeholder until the customer milestone; also serves the detail route.
 * An unknown customer id renders "Page not found" inside the shell instead of an empty list, and
 * a failed reference-data load renders a neutral error.
 */
export function CustomerShipmentsPage() {
  const { customerId } = useParams()
  const lookup = useCustomer(customerId)

  if (lookup.status === 'notFound') {
    return (
      <PageGutter>
        <NotFoundPage />
      </PageGutter>
    )
  }

  return (
    <PageGutter>
      <main className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          <FormattedMessage id="customerShipments.title" />
        </h1>
        {lookup.status === 'found' && <p className="font-medium">{lookup.customer.name}</p>}
        {lookup.status === 'loading' && <Skeleton className="h-5 w-40" />}
        {lookup.status === 'error'
          ? (
              <p role="alert" className="text-muted-foreground">
                <FormattedMessage id="customerShipments.loadFailed" />
              </p>
            )
          : (
              <p className="text-muted-foreground">
                <FormattedMessage id="page.comingSoon" />
              </p>
            )}
      </main>
    </PageGutter>
  )
}
