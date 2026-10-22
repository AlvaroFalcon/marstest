import { Link, useLocation } from 'react-router'
import { useIntl } from 'react-intl'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getNextSort,
  getSortState,
  type ShipmentListRow,
  type ShipmentSort,
  type ShipmentSortColumn,
} from '@/lib/shipmentList'
import { cn } from '@/lib/utils'
import { ShipmentListStatusBadge } from './ShipmentListStatusBadge'
import { ShipmentConfidence, ShipmentEstimate, ShipmentUpdated } from './ShipmentRowCells'
import { ShipmentsTableColGroup } from './ShipmentsTableColGroup'
import {
  formatShipmentCarrierEta,
  formatShipmentCarriers,
  formatShipmentMilestone,
  formatShipmentRoute,
  getShipmentRowHref,
} from './shipmentRowPresentation'

export type ShipmentsTableProps = {
  rows: ShipmentListRow[]
  /** Injected clock for the "updated x ago" wording. */
  now: Date
  /** Current order. Sorting happens before the rows arrive: the table only shows and requests it. */
  sort: ShipmentSort
  /** Called with the order a click on a sortable header leads to. */
  onSortChange: (sort: ShipmentSort) => void
  className?: string
}

// No optional table feature is needed: filtering, sorting and paging are URL state resolved in
// `src/lib/shipmentList.ts`, so the table only has to lay out the rows it is given.
const features = tableFeatures({})
const columnHelper = createColumnHelper<typeof features, ShipmentListRow>()

const SORT_COLUMNS: readonly ShipmentSortColumn[] = ['carrierEta', 'confidence']

function isSortColumn(columnId: string): columnId is ShipmentSortColumn {
  return SORT_COLUMNS.some(column => column === columnId)
}

type SortHeaderButtonProps = {
  label: string
  direction: 'asc' | 'desc' | null
  onClick: () => void
}

/** Header button of a sortable column; the arrow shows the active direction, the `th` carries `aria-sort`. */
function SortHeaderButton({ label, direction, onClick }: SortHeaderButtonProps) {
  const Icon = direction === null ? ChevronsUpDown : direction === 'asc' ? ArrowUp : ArrowDown

  return (
    // The negative margin cancels the button's inline padding so its label lines up with the cells
    // below; the caption size matches the plain headers.
    <Button variant="ghost" size="sm" className="-ml-2.5 text-caption" onClick={onClick}>
      {label}
      <Icon aria-hidden="true" />
    </Button>
  )
}

/**
 * Desktop list of shipments. Carrier ETA and confidence headers are buttons that cycle the sort;
 * the shipment id in the first cell is a real link stretched over the whole row, so the row is
 * clickable with a pointer and reachable with the keyboard through a single tab stop.
 */
export function ShipmentsTable({ rows, now, sort, onSortChange, className }: ShipmentsTableProps) {
  const intl = useIntl()
  const { search } = useLocation()
  const sortState = getSortState(sort)

  const columns = columnHelper.columns([
    columnHelper.display({
      id: 'shipment',
      header: () => intl.formatMessage({ id: 'shipmentList.column.shipment' }),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link
            to={getShipmentRowHref(row.original, search)}
            className="
              font-semibold outline-hidden
              after:absolute after:inset-0
              focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset
            "
          >
            {row.original.id}
          </Link>
          <span className="text-muted-foreground">{row.original.customerName}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'route',
      header: () => intl.formatMessage({ id: 'shipmentList.column.route' }),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{formatShipmentRoute(intl, row.original)}</span>
          <span className="text-muted-foreground">{formatShipmentCarriers(row.original)}</span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'milestone',
      header: () => intl.formatMessage({ id: 'shipmentList.column.milestoneUpdated' }),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatShipmentMilestone(intl, row.original)}</span>
          <ShipmentUpdated row={row.original} now={now} />
        </div>
      ),
    }),
    columnHelper.display({
      id: 'status',
      header: () => intl.formatMessage({ id: 'shipmentList.column.status' }),
      cell: ({ row }) => <ShipmentListStatusBadge status={row.original.status} />,
    }),
    columnHelper.display({
      id: 'carrierEta',
      header: () => (
        <SortHeaderButton
          label={intl.formatMessage({ id: 'shipmentList.column.carrierEta' })}
          direction={sortState.column === 'carrierEta' ? sortState.direction : null}
          onClick={() => onSortChange(getNextSort(sort, 'carrierEta'))}
        />
      ),
      cell: ({ row }) => formatShipmentCarrierEta(intl, row.original),
    }),
    columnHelper.display({
      // Keeps the `confidence` id: the estimate itself is not sortable, so the merged header sorts
      // by the confidence shown under it.
      id: 'confidence',
      header: () => (
        <SortHeaderButton
          label={intl.formatMessage({ id: 'shipmentList.column.estimateConfidence' })}
          direction={sortState.column === 'confidence' ? sortState.direction : null}
          onClick={() => onSortChange(getNextSort(sort, 'confidence'))}
        />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col items-start">
          <ShipmentEstimate row={row.original} />
          {/* A delivered shipment has neither; the estimate's dash is enough. */}
          {row.original.confidence !== null && (
            <ShipmentConfidence row={row.original} className="text-muted-foreground" />
          )}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'open',
      header: () => null,
      cell: () => <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />,
    }),
  ])

  const table = useTable({ features, columns, data: rows, getRowId: row => row.id })

  function getAriaSort(columnId: string): 'ascending' | 'descending' | 'none' | undefined {
    if (!isSortColumn(columnId)) {
      return undefined
    }
    if (sortState.column !== columnId) {
      return 'none'
    }
    return sortState.direction === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <Table
      className={cn('min-w-4xl table-fixed text-sm', className)}
      aria-label={intl.formatMessage({ id: 'shipmentList.table.label' })}
    >
      <ShipmentsTableColGroup />
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map(header => (
              <TableHead
                key={header.id}
                aria-sort={getAriaSort(header.column.id)}
                className="text-caption font-medium whitespace-normal text-muted-foreground"
              >
                {header.isPlaceholder ? null : <table.FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id} className="relative">
            {row.getAllCells().map(cell => (
              <TableCell key={cell.id} className="py-3 whitespace-normal">
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
