import { useIntl, type IntlShape } from 'react-intl'
import { CircleCheck, ClockAlert, type LucideIcon } from 'lucide-react'
import { EtaCard } from '@/components/provenance/EtaPair'
import { formatCarrierChannel, formatEtaInstant, formatUtcDay } from '@/components/provenance/formatProvenance'
import { Badge } from '@/components/ui/badge'
import type { CustomerArrival } from '@/lib/customerShipmentDetail'
import { cn } from '@/lib/utils'

type DeliveredArrival = Extract<CustomerArrival, { kind: 'delivered' }>

export type DeliveredEtaPairProps = {
  /** The delivered arrival from `buildCustomerShipmentDetail`; the component renders it as it is. */
  arrival: DeliveredArrival
  className?: string
}

type DeliveryBadge = {
  label: string
  icon: LucideIcon
  className: string
}

/** Early and on time share the success style; late is a warning. Icon and text always accompany the colour. */
function getDeliveryBadge(intl: IntlShape, deliveryVsPlan: DeliveredArrival['deliveryVsPlan']): DeliveryBadge {
  switch (deliveryVsPlan.kind) {
    case 'onTime':
      return { label: intl.formatMessage({ id: 'customerShipment.delivered.onTime' }), icon: CircleCheck, className: 'bg-success-subtle text-success' }
    case 'early':
      return {
        label: intl.formatMessage({ id: 'customerShipment.delivered.early' }, deliveryVsPlan.duration),
        icon: CircleCheck,
        className: 'bg-success-subtle text-success',
      }
    case 'late':
      return {
        label: intl.formatMessage({ id: 'customerShipment.delivered.late' }, deliveryVsPlan.duration),
        icon: ClockAlert,
        className: 'bg-warning-subtle text-warning',
      }
  }
}

function getSourceNote(intl: IntlShape, arrival: DeliveredArrival): string | undefined {
  if (arrival.source === null) return undefined

  return intl.formatMessage(
    { id: arrival.hasSignedProofOfDelivery ? 'customerShipment.delivered.sourceSigned' : 'customerShipment.delivered.source' },
    { carrier: arrival.source.carrierName, channel: formatCarrierChannel(intl, arrival.source.channel) },
  )
}

/**
 * The arrival cards of a delivered shipment: when and how it arrived next to the date planned at
 * dispatch, with how far apart they are. Same grid and equal height as `EtaPair`, but it shows no
 * estimate: once delivered there is nothing left to forecast, and the carrier ETA and our estimate
 * are not the baseline the customer judges by.
 */
export function DeliveredEtaPair({ arrival, className }: DeliveredEtaPairProps) {
  const intl = useIntl()
  const { label, icon: Icon, className: badgeClassName } = getDeliveryBadge(intl, arrival.deliveryVsPlan)

  return (
    // The wrapper is the size container so cards can switch layout and fluid type scales by width.
    <div className={cn('@container', className)}>
      <div className="
        grid gap-3
        @xl:grid-cols-2 @xl:gap-5
      "
      >
        <EtaCard
          label={intl.formatMessage({ id: 'customerShipment.delivered.label' })}
          note={getSourceNote(intl, arrival)}
          value={formatEtaInstant(intl, arrival.deliveredAt, 'sameDayTimes')}
        />
        <EtaCard
          badge={(
            <Badge variant="secondary" className={cn('h-6 px-2 text-caption', badgeClassName)}>
              <Icon aria-hidden="true" />
              {label}
            </Badge>
          )}
          label={intl.formatMessage({ id: 'customerShipment.delivered.plannedLabel' })}
          value={formatUtcDay(intl, arrival.plannedDeliveryAt)}
        />
      </div>
    </div>
  )
}
