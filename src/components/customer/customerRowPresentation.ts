import type { IntlShape } from 'react-intl'
import type { ProactiveAlertData } from '@/lib/customerShipments'
import type { ShipmentListRow } from '@/lib/shipmentList'
import routes from '@/routes'
import { formatShipmentEstimate, formatShipmentMilestone } from '@/components/shipments/shipmentRowPresentation'

/**
 * Where a customer row leads: the customer's own shipment detail.
 *
 * @param search - The list's current search string (with its leading `?`), so the detail can hand
 * the tab, search and page back.
 */
export function getCustomerShipmentHref(row: ShipmentListRow, search: string): string {
  return `${routes.customer.shipment(row.customerId, row.id)}${search}`
}

/** Transport modes in leg order, "Road · Sea · Road". The customer view never names carriers. */
export function formatShipmentModes(intl: IntlShape, row: ShipmentListRow): string {
  return row.modes.map(mode => intl.formatMessage({ id: `customerShipments.mode.${mode}` })).join(' · ')
}

/**
 * Sentence of the proactive alert, built only from structured fields (shipment id, latest
 * milestone, estimate window); diagnosis and draft text are internal and never used.
 */
export function formatProactiveAlertMessage(intl: IntlShape, { row }: ProactiveAlertData, isCompact: boolean): string {
  return intl.formatMessage(
    { id: isCompact ? 'proactiveAlert.messageCompact' : 'proactiveAlert.message' },
    {
      shipmentId: row.id,
      milestone: formatShipmentMilestone(intl, row),
      estimate: formatShipmentEstimate(intl, row) ?? '',
    },
  )
}
