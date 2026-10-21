import { Building2Icon, HeadsetIcon } from 'lucide-react'
import { useIntl } from 'react-intl'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type ViewerKind = 'ops' | 'customer'

export type ViewerOption = {
  value: string
  label: string
  kind: ViewerKind
}

export type ViewerSelectProps = {
  options: ViewerOption[]
  /** The `value` of the viewer currently selected. */
  value: string
  onValueChange: (value: string) => void
  className?: string
}

type ViewerIconProps = {
  kind: ViewerKind
}

function ViewerIcon({ kind }: ViewerIconProps) {
  return kind === 'ops' ? <HeadsetIcon aria-hidden="true" /> : <Building2Icon aria-hidden="true" />
}

/**
 * Role switch of the demo ("Viewing as"). Narrow containers show only an icon of the selected
 * role inside the trigger; wide containers show a muted "Viewing as" label before it instead.
 * The trigger always has an accessible name, whatever the visible label.
 */
export function ViewerSelect({ options, value, onValueChange, className }: ViewerSelectProps) {
  const intl = useIntl()
  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className="
          hidden text-sm text-muted-foreground
          @xl:inline
        "
      >
        {intl.formatMessage({ id: 'viewer.label' })}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={intl.formatMessage({ id: 'viewer.label' })} className="min-w-0 bg-card">
          {selectedOption && (
            <span className="@xl:hidden">
              <ViewerIcon kind={selectedOption.kind} />
            </span>
          )}
          <SelectValue>{selectedOption?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <ViewerIcon kind={option.kind} />
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
