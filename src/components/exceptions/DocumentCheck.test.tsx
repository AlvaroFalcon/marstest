import { screen, within } from '@testing-library/react'
import { DocumentCheck } from '@/components/exceptions/DocumentCheck'
import type { DocumentRow } from '@/lib/exceptionDetail'
import { renderWithProviders } from '@/test/renderWithProviders'

function renderRows(rows: DocumentRow[], poNumber = '4500-1187') {
  renderWithProviders(<DocumentCheck rows={rows} poNumber={poNumber} />)

  return within(screen.getByRole('list', { name: 'Documents checked against the ERP order' }))
}

describe('DocumentCheck', () => {
  it('shows the title and the neutral chip naming the ERP order', () => {
    renderRows([])

    expect(screen.getByRole('heading', { name: 'Document check' })).toBeInTheDocument()
    expect(screen.getByText('Cross-checked against ERP order PO 4500-1187')).toBeInTheDocument()
  })

  it('renders one row per document', () => {
    const rows = renderRows([
      { documentType: 'commercialInvoice', result: { kind: 'received', documentType: 'commercialInvoice' }, isCauseOfHold: false },
      { documentType: 'packingList', result: { kind: 'received', documentType: 'packingList' }, isCauseOfHold: false },
      { documentType: 'billOfLading', result: { kind: 'pending', documentId: 'doc-1', documentType: 'billOfLading' }, isCauseOfHold: false },
    ])

    expect(rows.getAllByRole('listitem')).toHaveLength(3)
  })

  it('shows the missing certificate of origin as the cause of the hold', () => {
    const rows = renderRows([
      { documentType: 'certificateOfOrigin', result: { kind: 'missing', documentType: 'certificateOfOrigin' }, isCauseOfHold: true },
    ])

    const row = rows.getByRole('listitem')

    expect(row).toHaveTextContent('Certificate of origin')
    expect(row).toHaveTextContent('Missing · cause of the hold')
  })

  it('shows a missing document that is not the cause of the hold as plain missing', () => {
    const rows = renderRows([
      { documentType: 'packingList', result: { kind: 'missing', documentType: 'packingList' }, isCauseOfHold: false },
    ])

    const row = rows.getByRole('listitem')

    expect(row).toHaveTextContent('Packing list')
    expect(row).not.toHaveTextContent('cause of the hold')
  })

  it('shows both HS codes when the commercial invoice differs from the ERP order', () => {
    const rows = renderRows([
      {
        documentType: 'commercialInvoice',
        result: { kind: 'mismatch', documentId: 'doc-1', documentType: 'commercialInvoice', field: 'hsCode', expected: '8467.21', actual: '8467.29' },
        isCauseOfHold: false,
      },
    ])

    expect(rows.getByRole('listitem')).toHaveTextContent('HS code 8467.29 differs from ERP order (8467.21)')
  })

  it('shows both weights, formatted, when the gross weight differs', () => {
    const rows = renderRows([
      {
        documentType: 'packingList',
        result: { kind: 'mismatch', documentId: 'doc-2', documentType: 'packingList', field: 'grossWeightKg', expected: 1840, actual: 2100 },
        isCauseOfHold: false,
      },
    ])

    expect(rows.getByRole('listitem')).toHaveTextContent('Weight 2,100 kg differs from ERP order (1,840 kg)')
  })

  it('shows a matching HS code as matching the ERP order', () => {
    const rows = renderRows([
      {
        documentType: 'customsDeclaration',
        result: { kind: 'match', documentId: 'doc-3', documentType: 'customsDeclaration', field: 'hsCode', expected: '8467.21', actual: '8467.21' },
        isCauseOfHold: false,
      },
    ])

    expect(rows.getByRole('listitem')).toHaveTextContent('Matches ERP order')
  })

  it('shows a document that has not arrived yet as not received', () => {
    const rows = renderRows([
      { documentType: 'billOfLading', result: { kind: 'pending', documentId: 'doc-4', documentType: 'billOfLading' }, isCauseOfHold: false },
    ])

    expect(rows.getByRole('listitem')).toHaveTextContent('Not received yet')
  })

  it('shows a received document with nothing to compare as received', () => {
    const rows = renderRows([
      { documentType: 'commercialInvoice', result: { kind: 'received', documentType: 'commercialInvoice' }, isCauseOfHold: false },
    ])

    expect(rows.getByRole('listitem')).toHaveTextContent('Received')
  })
})
