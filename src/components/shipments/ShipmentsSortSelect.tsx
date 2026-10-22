import { useIntl } from 'react-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SHIPMENT_SORTS, type ShipmentSort } from '@/lib/shipmentList'

export type ShipmentsSortSelectProps = {
  sort: ShipmentSort
  onSortChange: (sort: ShipmentSort) => void
  className?: string
}

/**
 * Sort control for the card layout, where there are no column headers to click. Offers the same
 * orders the table headers cycle through.
 */
export function ShipmentsSortSelect({ sort, onSortChange, className }: ShipmentsSortSelectProps) {
  const intl = useIntl()

  return (
    <Select
      value={sort}
      onValueChange={value => onSortChange(SHIPMENT_SORTS.find(option => option === value) ?? sort)}
    >
      <SelectTrigger aria-label={intl.formatMessage({ id: 'shipmentList.sort.label' })} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SHIPMENT_SORTS.map(option => (
          <SelectItem key={option} value={option}>
            {intl.formatMessage({ id: `shipmentList.sort.${option}` })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
