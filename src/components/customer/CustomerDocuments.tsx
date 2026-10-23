import { useIntl } from 'react-intl'
import { CalendarClock, Clock, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { CompactText } from '@/components/layout/CompactText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { CustomerDocumentRow, CustomerDocumentType } from '@/lib/customerDocuments'
import type { MessageId } from '@/locales/en'
import { cn } from '@/lib/utils'

export type CustomerDocumentsProps = {
  /** Rows from `buildCustomerShipmentDetail`; they carry no file names. */
  rows: CustomerDocumentRow[]
  className?: string
}

const DOCUMENT_NAME_IDS = {
  commercialInvoice: 'customerShipment.document.commercialInvoice',
  billOfLading: 'customerShipment.document.billOfLading',
  cmr: 'customerShipment.document.cmr',
  certificateOfOrigin: 'customerShipment.document.certificateOfOrigin',
  proofOfDelivery: 'customerShipment.document.proofOfDelivery',
} as const satisfies Record<CustomerDocumentType, MessageId>

type DocumentNameProps = {
  documentType: CustomerDocumentType
  name: string
}

/** The document name; only "CMR" has a compact form for narrow containers. */
function DocumentName({ documentType, name }: DocumentNameProps) {
  const intl = useIntl()

  if (documentType === 'cmr') {
    return <CompactText full={name} compact={intl.formatMessage({ id: 'customerShipment.document.cmrShort' })} />
  }

  return name
}

type DocumentRowItemProps = {
  row: CustomerDocumentRow
}

function DocumentRowItem({ row }: DocumentRowItemProps) {
  const intl = useIntl()
  const { documentType, availability } = row
  const isSignedProof = documentType === 'proofOfDelivery' && availability.kind === 'download'
  const name = intl.formatMessage({
    id: isSignedProof ? 'customerShipment.document.proofOfDeliverySigned' : DOCUMENT_NAME_IDS[documentType],
  })

  return (
    <li className="flex min-h-11 items-center justify-between gap-3 py-1">
      <span className="flex min-w-0 items-center gap-2 text-sm">
        <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <DocumentName documentType={documentType} name={name} />
      </span>
      <DocumentAvailability availability={availability} name={name} />
    </li>
  )
}

type DocumentAvailabilityProps = {
  availability: CustomerDocumentRow['availability']
  name: string
}

function DocumentAvailability({ availability, name }: DocumentAvailabilityProps) {
  const intl = useIntl()

  if (availability.kind === 'download') {
    return (
      <Button
        aria-label={intl.formatMessage({ id: 'customerShipment.documents.downloadLabel' }, { document: name })}
        className={cn(`
          h-11 shrink-0
          @md:h-8
        `)}
        onClick={() => toast.success(intl.formatMessage({ id: 'customerShipment.documents.downloadStarted' }))}
        type="button"
        variant="link"
      >
        <Download aria-hidden="true" />
        {intl.formatMessage({ id: 'customerShipment.documents.download' })}
      </Button>
    )
  }

  const Icon = availability.kind === 'pending' ? Clock : CalendarClock
  const labelId = availability.kind === 'pending' ? 'customerShipment.documents.pending' : 'customerShipment.documents.afterDelivery'

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
      <Icon aria-hidden="true" className="size-4" />
      {intl.formatMessage({ id: labelId })}
    </span>
  )
}

type DocumentListProps = Pick<CustomerDocumentsProps, 'rows'>

function DocumentList({ rows }: DocumentListProps) {
  const intl = useIntl()

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'customerShipment.documents.empty' })}</p>
  }

  return (
    <ul className="flex flex-col divide-y">
      {rows.map(row => <DocumentRowItem key={row.documentType} row={row} />)}
    </ul>
  )
}

/**
 * The documents a customer may see for one shipment. Each row says what it is and what the
 * customer can do now: download it, wait for it ("Pending") or wait for the delivery. Downloads are
 * simulated with a toast: the prototype has no files. Needs an `@container` ancestor for the
 * compact "CMR" name.
 */
export function CustomerDocuments({ rows, className }: CustomerDocumentsProps) {
  const intl = useIntl()

  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-base font-semibold">{intl.formatMessage({ id: 'customerShipment.documents.title' })}</h2>
      </CardHeader>
      <CardContent>
        <DocumentList rows={rows} />
      </CardContent>
    </Card>
  )
}
