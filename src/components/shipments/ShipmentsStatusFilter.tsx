import { useId, useState } from 'react'
import { useIntl } from 'react-intl'
import { Check, ChevronDown, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SHIPMENT_LIST_STATUSES, type ShipmentListStatus } from '@/lib/shipmentList'
import { cn } from '@/lib/utils'

export type ShipmentsStatusFilterProps = {
  /** Selected status, or `null` for any. */
  selectedStatus: ShipmentListStatus | null
  /** Called with a status, or `null` for "All statuses". */
  onSelect: (status: ShipmentListStatus | null) => void
  /** True on wide layouts (popover); false renders a bottom sheet. Decided by the page with `useMediaQuery`. */
  isDesktop: boolean
  className?: string
}

const ANY_STATUS_VALUE = 'any'

type StatusRowProps = {
  value: string
  label: string
  isSelected: boolean
}

/** One radio row: the transparent radio covers the row, the check icon is the visible indicator. */
function StatusRow({ value, label, isSelected }: StatusRowProps) {
  const labelId = useId()

  return (
    <div className="
      relative flex items-center gap-2 rounded-md px-2 py-2.5 text-sm transition-colors
      hover:bg-accent
      has-focus-visible:ring-3 has-focus-visible:ring-ring/50
      has-aria-checked:bg-accent has-aria-checked:font-medium
    "
    >
      <RadioGroupItem
        value={value}
        aria-labelledby={labelId}
        className="absolute inset-0 aspect-auto size-full rounded-md border-0 bg-transparent opacity-0"
      />
      <Check aria-hidden="true" className={cn('size-4 text-info', !isSelected && 'invisible')} />
      <span id={labelId} className="flex-1">{label}</span>
    </div>
  )
}

/**
 * Status filter of the shipments list, built like the site filter: a trigger that shows the
 * current choice ("Status: all") opens a radio list in a popover on wide layouts and in a bottom
 * sheet on narrow ones. Picking with pointer, Enter or Space applies the choice and closes it;
 * arrow keys only move it.
 */
export function ShipmentsStatusFilter({ selectedStatus, onSelect, isDesktop, className }: ShipmentsStatusFilterProps) {
  const intl = useIntl()
  const [isOpen, setIsOpen] = useState(false)
  const selectedValue = selectedStatus ?? ANY_STATUS_VALUE
  const selectedLabel = selectedStatus === null
    ? intl.formatMessage({ id: 'shipmentList.statusFilter.any' })
    : intl.formatMessage({ id: `shipmentList.status.${selectedStatus}` })

  const list = (
    <RadioGroup
      aria-label={intl.formatMessage({ id: 'shipmentList.statusFilter.title' })}
      value={selectedValue}
      onValueChange={value => onSelect(SHIPMENT_LIST_STATUSES.find(status => status === value) ?? null)}
      className="gap-0.5"
      onPointerUp={() => setIsOpen(false)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') setIsOpen(false)
      }}
    >
      <StatusRow
        value={ANY_STATUS_VALUE}
        label={intl.formatMessage({ id: 'shipmentList.statusFilter.anyOption' })}
        isSelected={selectedValue === ANY_STATUS_VALUE}
      />
      {SHIPMENT_LIST_STATUSES.map(status => (
        <StatusRow
          key={status}
          value={status}
          label={intl.formatMessage({ id: `shipmentList.status.${status}` })}
          isSelected={selectedValue === status}
        />
      ))}
    </RadioGroup>
  )

  const trigger = (
    <Button variant="outline" className={cn('max-w-full', className)}>
      <ListFilter aria-hidden="true" />
      <span className="truncate">{intl.formatMessage({ id: 'shipmentList.statusFilter.trigger' }, { status: selectedLabel })}</span>
      <ChevronDown aria-hidden="true" />
    </Button>
  )

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" className="w-64 gap-1 p-2">{list}</PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-xl pb-4">
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="pt-0">
          <SheetTitle className="text-lg">{intl.formatMessage({ id: 'shipmentList.statusFilter.title' })}</SheetTitle>
          <SheetDescription>{intl.formatMessage({ id: 'shipmentList.statusFilter.description' })}</SheetDescription>
        </SheetHeader>
        <div className="px-4">{list}</div>
      </SheetContent>
    </Sheet>
  )
}
