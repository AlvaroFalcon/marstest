import type { Viewer } from '@/lib/scope'

const OPS_VALUE = 'ops'
const CUSTOMER_PREFIX = 'customer:'

/**
 * Encodes a viewer as the string value of the "Viewing as" select. Customers are prefixed so a
 * customer id can never collide with the ops value.
 */
export function viewerToValue(viewer: Viewer): string {
  return viewer.role === 'ops' ? OPS_VALUE : `${CUSTOMER_PREFIX}${viewer.customerId}`
}

/**
 * Decodes a value produced by {@link viewerToValue}.
 *
 * @returns `null` when the value does not name a viewer.
 * @example
 * parseViewerValue('customer:nordwerk') // { role: 'customer', customerId: 'nordwerk' }
 */
export function parseViewerValue(value: string): Viewer | null {
  if (value === OPS_VALUE) {
    return { role: 'ops' }
  }
  if (value.startsWith(CUSTOMER_PREFIX) && value.length > CUSTOMER_PREFIX.length) {
    return { role: 'customer', customerId: value.slice(CUSTOMER_PREFIX.length) }
  }
  return null
}
