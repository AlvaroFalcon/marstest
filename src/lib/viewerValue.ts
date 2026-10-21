import type { Viewer } from '@/lib/scope'

/** Result of decoding a select value: the viewer, or a failure when the value names none. */
export type ParsedViewer
  = | { ok: true, viewer: Viewer }
    | { ok: false }

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
 * @returns `{ ok: false }` when the value does not name a viewer.
 * @example
 * parseViewerValue('customer:nordwerk') // { ok: true, viewer: { role: 'customer', customerId: 'nordwerk' } }
 */
export function parseViewerValue(value: string): ParsedViewer {
  if (value === OPS_VALUE) {
    return { ok: true, viewer: { role: 'ops' } }
  }
  if (value.startsWith(CUSTOMER_PREFIX) && value.length > CUSTOMER_PREFIX.length) {
    return { ok: true, viewer: { role: 'customer', customerId: value.slice(CUSTOMER_PREFIX.length) } }
  }
  return { ok: false }
}
