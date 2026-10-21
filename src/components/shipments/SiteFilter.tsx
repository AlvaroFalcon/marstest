import { useId, useState } from 'react'
import { useIntl } from 'react-intl'
import { Check, ChevronDown, Factory, Lock } from 'lucide-react'
import type { Site } from '@/api/types'
import { Button } from '@/components/ui/button'
import { CompactText } from '@/components/layout/CompactText'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

/** A site of the filter with how many open exceptions it has (unfiltered, so the counts never change with the selection). */
export type SiteFilterOption = {
  site: Pick<Site, 'id' | 'name' | 'inOpsScope'>
  exceptionCount: number
}

export type SiteFilterProps = {
  /** Every site of the reference data; the out-of-scope ones are listed locked, never selectable. */
  options: SiteFilterOption[]
  /** Id of the selected in-scope site, or `null` for all the user's sites. */
  selectedSiteId: string | null
  /** Open exceptions across all in-scope sites (the "All my sites" count). */
  totalExceptionCount: number
  /** Called with a site id, or `null` for "All my sites". */
  onSelect: (siteId: string | null) => void
  /** True on wide layouts (popover); false renders a bottom sheet. Decided by the page with `useMediaQuery`. */
  isDesktop: boolean
  className?: string
}

const ALL_SITES_VALUE = 'all'

type SiteFilterListProps = {
  inScopeOptions: SiteFilterOption[]
  outOfScopeOptions: SiteFilterOption[]
  selectedSiteId: string | null
  totalExceptionCount: number
  onValueChange: (siteId: string | null) => void
  /** Called when the user confirms a choice (pointer, Enter or Space), as opposed to arrow keys that only move it. */
  onConfirm: () => void
}

type SiteRowProps = {
  value: string
  name: string
  isSelected: boolean
  count: number
  showCountLabel: boolean
}

/**
 * One radio row. The radio button covers the whole row but is transparent: the check icon is the
 * visible indicator (no circles), and the row shows the focus ring through `:has(:focus-visible)`.
 */
function SiteRow({ value, name, isSelected, count, showCountLabel }: SiteRowProps) {
  const intl = useIntl()
  const nameId = useId()
  const countId = useId()
  const countText = intl.formatMessage({ id: 'siteFilter.exceptionCount' }, { count })

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
        aria-labelledby={`${nameId} ${countId}`}
        className="absolute inset-0 aspect-auto size-full rounded-md border-0 bg-transparent opacity-0"
      />
      <Check aria-hidden="true" className={cn('size-4 text-info', !isSelected && 'invisible')} />
      <span id={nameId} className="flex-1">{name}</span>
      <span id={countId} className="text-muted-foreground tabular-nums">
        {showCountLabel
          ? countText
          : (
              <>
                <span aria-hidden="true">{intl.formatNumber(count)}</span>
                <span className="sr-only">{countText}</span>
              </>
            )}
      </span>
    </div>
  )
}

/**
 * The shared site list: a radio group (arrow keys move the selection) followed by the locked
 * out-of-scope sites outside the group, so they can be read but never chosen.
 */
function SiteFilterList({
  inScopeOptions,
  outOfScopeOptions,
  selectedSiteId,
  totalExceptionCount,
  onValueChange,
  onConfirm,
}: SiteFilterListProps) {
  const intl = useIntl()
  const selectedValue = selectedSiteId ?? ALL_SITES_VALUE

  return (
    <div className="flex flex-col gap-1">
      <RadioGroup
        aria-label={intl.formatMessage({ id: 'siteFilter.title' })}
        value={selectedValue}
        onValueChange={value => onValueChange(value === ALL_SITES_VALUE ? null : value)}
        className="gap-0.5"
        onPointerUp={onConfirm}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onConfirm()
        }}
      >
        <SiteRow
          value={ALL_SITES_VALUE}
          name={intl.formatMessage({ id: 'siteFilter.allSites' })}
          isSelected={selectedValue === ALL_SITES_VALUE}
          count={totalExceptionCount}
          showCountLabel
        />
        {inScopeOptions.map(({ site, exceptionCount }) => (
          <SiteRow
            key={site.id}
            value={site.id}
            name={site.name}
            isSelected={selectedValue === site.id}
            count={exceptionCount}
            showCountLabel={false}
          />
        ))}
      </RadioGroup>
      {outOfScopeOptions.length > 0 && (
        <div className="mt-1 flex flex-col gap-0.5 border-t pt-1">
          {outOfScopeOptions.map(({ site }) => (
            <div
              key={site.id}
              aria-disabled="true"
              className="flex items-center gap-2 px-2 py-2.5 text-sm text-muted-foreground"
            >
              <Lock aria-hidden="true" className="size-4" />
              {intl.formatMessage({ id: 'siteFilter.outOfScope' }, { site: site.name })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Site filter of the exceptions inbox. The trigger shows the current choice with a count; the list
 * opens in a popover on wide layouts and in a bottom sheet on narrow ones, and picking a row
 * applies it on change and closes the list on a pointer, Enter or Space confirmation (arrow keys move the choice without closing, so the options can be browsed). Sites outside the user's scope are listed locked, so the user
 * sees they exist but not why they are missing from the inbox.
 *
 * The trigger label reads "All my sites (3)" in wide containers and "My sites (3)" in narrow ones
 * through a container query, so an ancestor must be an `@container`. With one site selected the
 * count is that site's exceptions ("Zaragoza plant (3)"); with all, it is the number of sites.
 */
export function SiteFilter({
  options,
  selectedSiteId,
  totalExceptionCount,
  onSelect,
  isDesktop,
  className,
}: SiteFilterProps) {
  const intl = useIntl()
  const [isOpen, setIsOpen] = useState(false)
  const inScopeOptions = options.filter(option => option.site.inOpsScope)
  const outOfScopeOptions = options.filter(option => !option.site.inOpsScope)
  const selectedOption = inScopeOptions.find(option => option.site.id === selectedSiteId)

  function handleValueChange(siteId: string | null) {
    onSelect(siteId)
  }

  const list = (
    <SiteFilterList
      inScopeOptions={inScopeOptions}
      outOfScopeOptions={outOfScopeOptions}
      selectedSiteId={selectedSiteId}
      totalExceptionCount={totalExceptionCount}
      onValueChange={handleValueChange}
      onConfirm={() => setIsOpen(false)}
    />
  )

  const trigger = (
    <Button variant="outline" className={cn('max-w-full', className)}>
      <Factory aria-hidden="true" />
      {selectedOption === undefined
        ? (
            <>
              <CompactText compact={intl.formatMessage({ id: 'siteFilter.triggerAllShort' }, { count: inScopeOptions.length })} full={intl.formatMessage({ id: 'siteFilter.triggerAll' }, { count: inScopeOptions.length })} />
            </>
          )
        : (
            <span className="truncate">
              {intl.formatMessage(
                { id: 'siteFilter.triggerSite' },
                { site: selectedOption.site.name, count: selectedOption.exceptionCount },
              )}
            </span>
          )}
      <ChevronDown aria-hidden="true" />
    </Button>
  )

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="end" className="w-80 gap-1 p-2">
          <p className="px-2 py-1 text-caption text-muted-foreground">
            {intl.formatMessage({ id: 'siteFilter.caption' })}
          </p>
          {list}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-xl pb-4">
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="pt-0">
          <SheetTitle className="text-lg">{intl.formatMessage({ id: 'siteFilter.title' })}</SheetTitle>
          <SheetDescription>{intl.formatMessage({ id: 'siteFilter.description' })}</SheetDescription>
        </SheetHeader>
        <div className="px-4">{list}</div>
      </SheetContent>
    </Sheet>
  )
}
