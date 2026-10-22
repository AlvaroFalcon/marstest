import type { ReactNode } from 'react'
import type { Customer } from '@/api/types'
import { PageGutter } from '@/components/layout/PageGutter'
import { useCustomer } from '@/hooks/useCustomer'
import { NotFoundPage } from '@/pages/NotFoundPage'

export type CustomerGateProps = {
  /** Customer id from the URL; `undefined` reads as an unknown customer. */
  customerId: string | undefined
  /** Placeholder while the reference data loads, so "Page not found" never flashes. */
  loading: ReactNode
  /** Neutral message when the reference data fails, so a failure never reads as "Page not found". */
  error: ReactNode
  /** Rendered only for a known customer. */
  children: (customer: Customer) => ReactNode
}

/**
 * Resolves the customer of a customer route inside the page gutter and renders `children` only
 * for a known one. An unknown customer id reads "Page not found". Shared by the list and the
 * detail so both treat the URL the same way.
 */
export function CustomerGate({ customerId, loading, error, children }: CustomerGateProps) {
  const lookup = useCustomer(customerId)

  switch (lookup.status) {
    case 'notFound':
      return (
        <PageGutter>
          <NotFoundPage />
        </PageGutter>
      )
    case 'loading':
      return <PageGutter>{loading}</PageGutter>
    case 'error':
      return <PageGutter>{error}</PageGutter>
    case 'found':
      return <PageGutter>{children(lookup.customer)}</PageGutter>
  }
}
