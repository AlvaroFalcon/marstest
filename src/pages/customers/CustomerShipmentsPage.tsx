import { FormattedMessage } from 'react-intl'
import { useParams } from 'react-router'
import { PageGutter } from '@/components/layout/PageGutter'
import { Skeleton } from '@/components/ui/skeleton'
import { useReferenceData } from '@/hooks/useReferenceData'
import { NotFoundPage } from '@/pages/NotFoundPage'

/**
 * Customer shipments list. Placeholder until the customer milestone; also serves the detail route.
 * An unknown customer id renders "Page not found" inside the shell instead of an empty list.
 */
export function CustomerShipmentsPage() {
  const { customerId } = useParams()
  const referenceData = useReferenceData()

  if (referenceData.data && !referenceData.data.customers.some(candidate => candidate.id === customerId)) {
    return (
      <PageGutter>
        <NotFoundPage />
      </PageGutter>
    )
  }

  const customer = referenceData.data?.customers.find(candidate => candidate.id === customerId)

  return (
    <PageGutter>
      <main className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          <FormattedMessage id="customerShipments.title" />
        </h1>
        {customer
          ? <p className="font-medium">{customer.name}</p>
          : referenceData.isPending && <Skeleton className="h-5 w-40" />}
        <p className="text-muted-foreground">
          <FormattedMessage id="page.comingSoon" />
        </p>
      </main>
    </PageGutter>
  )
}
