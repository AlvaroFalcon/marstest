import { useIntl } from 'react-intl'
import type { Shipment } from '@/api/types'
import { Journey } from '@/components/journey/Journey'
import { AiBlock } from '@/components/provenance/AiBlock'
import { EtaPair } from '@/components/provenance/EtaPair'
import { FreshnessIndicator } from '@/components/provenance/FreshnessIndicator'
import { formatEvidenceLabel } from '@/components/provenance/formatProvenance'
import { CompactText } from '@/components/layout/CompactText'
import { ShipmentListStatusBadge } from '@/components/shipments/ShipmentListStatusBadge'
import type { CustomerShipmentDetailModel } from '@/lib/customerShipmentDetail'
import { cn } from '@/lib/utils'
import { CustomerDocuments } from './CustomerDocuments'
import { DeliveredEtaPair } from './DeliveredEtaPair'

export type CustomerShipmentDetailProps = {
  /** The customer's own shipment: the ETA pair and the journey derive their presentation from it. */
  shipment: Shipment
  /** Customer-safe values from `buildCustomerShipmentDetail`; the component renders them as they are. */
  detail: CustomerShipmentDetailModel
  /** Injected clock for every relative time on the screen. */
  now: Date
  className?: string
}

type CustomerFreshnessTextProps = Pick<CustomerShipmentDetailProps, 'detail' | 'now'>

function CustomerFreshnessText({ detail, now }: CustomerFreshnessTextProps) {
  const intl = useIntl()
  const { freshness } = detail

  if (freshness.kind === 'final') {
    return (
      <CompactText
        className="text-sm text-muted-foreground"
        full={intl.formatMessage({ id: 'customerShipment.freshness.final' })}
        compact={intl.formatMessage({ id: 'customerShipment.freshness.finalShort' })}
      />
    )
  }

  return (
    <FreshnessIndicator freshness={freshness.freshness} now={now} />
  )
}

type CustomerArrivalProps = Pick<CustomerShipmentDetailProps, 'shipment' | 'now'> & {
  arrival: CustomerShipmentDetailModel['arrival']
}

/** The delivery card once delivered; the ETA pair while in transit. */
function CustomerArrival({ shipment, arrival, now }: CustomerArrivalProps) {
  if (arrival.kind === 'delivered') {
    return <DeliveredEtaPair arrival={arrival} />
  }

  return (
    <EtaPair
      carrierEta={shipment.carrierEta}
      carrierName={arrival.etaCarrierName}
      estimatedEta={shipment.estimatedEta}
      now={now}
      variant="reason"
    />
  )
}

/**
 * Customer view of one of their shipments: title and status, AI summary, ETAs or delivery,
 * journey and documents, in a single column. It never receives internal data, and nothing on it
 * opens the source events: the evidence is plain text and the journey steps are not clickable.
 * In a narrow container the title takes its own row and the badge and freshness wrap below it.
 */
export function CustomerShipmentDetail({ shipment, detail, now, className }: CustomerShipmentDetailProps) {
  const intl = useIntl()

  return (
    <article className={cn('@container flex flex-col gap-6', className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="
          w-full text-xl font-semibold text-balance
          @xl:w-auto @xl:text-2xl
        "
        >
          {intl.formatMessage({ id: 'customerShipment.title' }, { shipmentId: detail.shipmentId, route: detail.routeLabel })}
        </h1>
        <ShipmentListStatusBadge status={detail.status} />
        <p>
          <CustomerFreshnessText detail={detail} now={now} />
        </p>
      </header>
      <AiBlock
        title={intl.formatMessage({ id: 'customerShipment.ai.title' })}
        evidence={{ label: formatEvidenceLabel(intl, { kind: 'carrierEvents', count: detail.summary.eventCount }) }}
      >
        {detail.summary.text}
      </AiBlock>
      <CustomerArrival shipment={shipment} arrival={detail.arrival} now={now} />
      <Journey carrierNames={detail.carrierNames} now={now} shipment={shipment} />
      <CustomerDocuments rows={detail.documents} />
    </article>
  )
}
