import { CircleCheck, CircleX, Clock, FileCheck, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { IntlShape } from 'react-intl'
import type { DocumentRow } from '@/lib/exceptionDetail'

/** Text and icon of one document row. `compact` is the short copy for narrow containers. */
export type DocumentRowPresentation = {
  icon: LucideIcon
  /** Semantic text colour class of the icon and the result. */
  toneClassName: string
  full: string
  compact: string
}

/**
 * Words the result of a document row. The lib returns kinds and raw values (ADR 0049); the copy,
 * the numbers formatting and the icon are decided here.
 */
export function presentDocumentRow(intl: IntlShape, row: DocumentRow): DocumentRowPresentation {
  const { result } = row

  switch (result.kind) {
    case 'match':
      return {
        icon: CircleCheck,
        toneClassName: 'text-success',
        full: intl.formatMessage({ id: result.field === 'hsCode' ? 'documentCheck.result.hsMatch' : 'documentCheck.result.weightMatch' }),
        compact: intl.formatMessage({ id: result.field === 'hsCode' ? 'documentCheck.result.hsMatchShort' : 'documentCheck.result.weightMatchShort' }),
      }
    case 'mismatch':
      return {
        icon: TriangleAlert,
        toneClassName: 'text-warning',
        full: result.field === 'hsCode'
          ? intl.formatMessage({ id: 'documentCheck.result.hsMismatch' }, { actual: result.actual, expected: result.expected })
          : intl.formatMessage(
              { id: 'documentCheck.result.weightMismatch' },
              { actual: intl.formatNumber(result.actual), expected: intl.formatNumber(result.expected) },
            ),
        compact: intl.formatMessage({ id: result.field === 'hsCode' ? 'documentCheck.result.hsMismatchShort' : 'documentCheck.result.weightMismatchShort' }),
      }
    case 'missing':
      return {
        icon: CircleX,
        toneClassName: 'text-destructive',
        full: intl.formatMessage({ id: row.isCauseOfHold ? 'documentCheck.result.missingCause' : 'documentCheck.result.missing' }),
        compact: intl.formatMessage({ id: 'documentCheck.result.missing' }),
      }
    case 'pending':
      return {
        icon: Clock,
        toneClassName: 'text-muted-foreground',
        full: intl.formatMessage({ id: 'documentCheck.result.pending' }),
        compact: intl.formatMessage({ id: 'documentCheck.result.pendingShort' }),
      }
    case 'received': {
      const received = intl.formatMessage({ id: 'documentCheck.result.received' })
      return { icon: FileCheck, toneClassName: 'text-muted-foreground', full: received, compact: received }
    }
  }
}
