import { useIntl } from 'react-intl'
import { FileCheck } from 'lucide-react'
import { presentDocumentRow } from '@/components/exceptions/formatDocumentCheck'
import { CompactText } from '@/components/layout/CompactText'
import type { DocumentRow } from '@/lib/exceptionDetail'
import { cn } from '@/lib/utils'

export type DocumentCheckProps = {
  /** One row per required document, worst finding each, from `buildDocumentRows`. */
  rows: DocumentRow[]
  /** PO number of the ERP order the documents were checked against, without prefix. */
  poNumber: string
  className?: string
}

type DocumentCheckRowProps = {
  row: DocumentRow
}

function DocumentCheckRow({ row }: DocumentCheckRowProps) {
  const intl = useIntl()
  const { icon: Icon, toneClassName, full, compact } = presentDocumentRow(intl, row)

  return (
    <li className="flex items-start justify-between gap-3 border-b py-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon aria-hidden="true" className={cn('size-4 shrink-0', toneClassName)} />
        {intl.formatMessage({ id: `documentCheck.type.${row.documentType}` })}
      </span>
      <CompactText compact={compact} full={full} className={cn('text-end text-sm', toneClassName)} />
    </li>
  )
}

/**
 * Shows each required document of the shipment against the ERP order, one row per document with
 * its worst finding. The check is rule-based, so the chip is neutral (no AI styling, ADR 0029).
 * Each row carries an icon and text, never colour alone. It is an `@container`, so the result copy
 * shortens in narrow containers.
 */
export function DocumentCheck({ rows, poNumber, className }: DocumentCheckProps) {
  const intl = useIntl()
  const po = intl.formatMessage({ id: 'shipmentDetail.po' }, { poNumber })

  return (
    <section className={cn('@container flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="text-base font-semibold">{intl.formatMessage({ id: 'documentCheck.title' })}</h2>
        <span className="
          inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-caption text-muted-foreground
        "
        >
          <FileCheck aria-hidden="true" className="size-3.5 shrink-0" />
          <CompactText
            compact={intl.formatMessage({ id: 'documentCheck.chipShort' }, { po })}
            full={intl.formatMessage({ id: 'documentCheck.chip' }, { po })}
          />
        </span>
      </div>
      <ul
        aria-label={intl.formatMessage({ id: 'documentCheck.listLabel' })}
        className="flex flex-col border-t"
      >
        {rows.map(row => <DocumentCheckRow key={row.documentType} row={row} />)}
      </ul>
    </section>
  )
}
