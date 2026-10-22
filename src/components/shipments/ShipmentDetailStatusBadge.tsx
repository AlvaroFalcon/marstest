import { useIntl } from 'react-intl'
import { Eye } from 'lucide-react'
import { ExceptionStatusBadge } from '@/components/exceptions/ExceptionStatusBadge'
import { toExceptionStatus } from '@/components/exceptions/toExceptionStatus'
import { ShipmentListStatusBadge } from '@/components/shipments/ShipmentListStatusBadge'
import { Badge } from '@/components/ui/badge'
import type { Freshness } from '@/lib/freshness'
import type { ShipmentDetailState } from '@/lib/shipmentDetailState'
import type { ShipmentListStatus } from '@/lib/shipmentList'

export type ShipmentDetailStatusBadgeProps = {
  state: ShipmentDetailState
  /** Needed to word the "No update N h" badge of a stale-tracking exception. */
  freshness: Freshness
}

const LIST_STATUS_BY_STATE = {
  onTrack: 'onTime',
  predictedDelay: 'atRisk',
  stale: 'stale',
  scheduled: 'scheduled',
  delivered: 'delivered',
} as const satisfies Partial<Record<ShipmentDetailState['kind'], ShipmentListStatus>>

/**
 * The status badge next to the title of the ops shipment detail. It reuses the badges the list
 * shows, so the status read in the list is the one found again here: "On time", "At risk", ... A
 * shipment with another open exception shows the type of that exception instead, as in the inbox,
 * and one that is only being watched shows "Watching" (the list counts it as on time). Every badge
 * has an icon and a label, so the status never depends on colour alone.
 */
export function ShipmentDetailStatusBadge({ state, freshness }: ShipmentDetailStatusBadgeProps) {
  const intl = useIntl()

  switch (state.kind) {
    case 'watching':
      return (
        <Badge variant="secondary" className="h-6 bg-warning-subtle px-2 text-caption text-warning">
          <Eye aria-hidden="true" />
          {intl.formatMessage({ id: 'shipmentState.watching' })}
        </Badge>
      )
    case 'exception':
      return <ExceptionStatusBadge status={toExceptionStatus(state.exception.type, freshness)} />
    case 'onTrack':
    case 'predictedDelay':
    case 'stale':
    case 'scheduled':
    case 'delivered':
      return <ShipmentListStatusBadge status={LIST_STATUS_BY_STATE[state.kind]} />
  }
}
