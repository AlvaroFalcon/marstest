import type { ExceptionType } from '@/api/types'
import type { ExceptionStatus } from '@/components/exceptions/ExceptionStatusBadge'
import type { Freshness } from '@/lib/freshness'

/**
 * Builds the badge input for an exception type. Stale tracking shows the whole hours without news,
 * which only the freshness of the shipment knows.
 */
export function toExceptionStatus(type: ExceptionType, freshness: Freshness): ExceptionStatus {
  if (type === 'staleTracking') {
    return { type, staleHours: freshness.kind === 'notApplicable' ? 0 : Math.floor(freshness.hoursSinceUpdate) }
  }
  return { type }
}
