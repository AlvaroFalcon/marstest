import type { Customer } from '@/api/types'
import { useReferenceData } from '@/hooks/useReferenceData'

/** Outcome of resolving a customer id against the reference data. */
export type CustomerLookup
  = | { status: 'loading' }
    | { status: 'error' }
    | { status: 'notFound' }
    | { status: 'found', customer: Customer }

/**
 * Resolves a customer id from the URL into one explicit {@link CustomerLookup}, so pages never
 * mistake "still loading" or "failed to load" for "unknown customer".
 */
export function useCustomer(customerId: string | undefined): CustomerLookup {
  const referenceData = useReferenceData()

  if (referenceData.isError) {
    return { status: 'error' }
  }
  if (!referenceData.isSuccess) {
    return { status: 'loading' }
  }

  const customer = referenceData.data.customers.find(candidate => candidate.id === customerId)
  return customer ? { status: 'found', customer } : { status: 'notFound' }
}
