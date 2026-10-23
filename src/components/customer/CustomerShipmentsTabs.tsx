import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { TriangleAlert } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CUSTOMER_SHIPMENT_TABS,
  type CustomerShipmentTab,
  type CustomerTabCounts,
} from '@/lib/customerShipments'
import { cn } from '@/lib/utils'

function isCustomerShipmentTab(value: string): value is CustomerShipmentTab {
  return CUSTOMER_SHIPMENT_TABS.some(tab => tab === value)
}

/** Chip look of the narrow layout: outlined, filled with the primary colour when selected. */
const CHIP_CLASS_NAME = `
  h-8 flex-none rounded-full border-border bg-card px-3 text-foreground
  data-active:border-transparent data-active:bg-primary data-active:text-primary-foreground
  dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground
`

/** "Needs attention" is told by the warning tone plus the icon, so the tone is never the only cue. */
const ATTENTION_TAB_CLASS_NAME = 'text-warning dark:text-warning'

const ATTENTION_CHIP_CLASS_NAME = `
  border-warning text-warning
  dark:text-warning
  data-active:text-primary-foreground
  dark:data-active:text-primary-foreground
`

type TabsScrollerProps = {
  isDesktop: boolean
  children: ReactNode
}

function TabsScroller({ isDesktop, children }: TabsScrollerProps) {
  if (isDesktop) {
    return children
  }

  // Own scroll container: four chips are wider than a phone, and the page itself must never
  // scroll sideways. The padding keeps the focus ring from being clipped.
  return <div className="max-w-full overflow-x-auto p-1">{children}</div>
}

export type CustomerShipmentsTabsProps = {
  activeTab: CustomerShipmentTab
  counts: CustomerTabCounts
  onTabChange: (tab: CustomerShipmentTab) => void
  /** True on wide layouts (tabs); false renders the same choices as a row of chips. */
  isDesktop: boolean
  className?: string
}

/**
 * Status tabs of the customer list (All, Needs attention, In transit, Delivered) with the count in
 * each label. The tabs only choose what the list below shows; the panel is the list itself.
 */
export function CustomerShipmentsTabs({ activeTab, counts, onTabChange, isDesktop, className }: CustomerShipmentsTabsProps) {
  const intl = useIntl()

  const tabs = (
    <TabsList
      aria-label={intl.formatMessage({ id: 'customerShipments.tabs.label' })}
      className={cn(!isDesktop && 'h-auto w-max justify-start gap-2 bg-transparent p-0')}
    >
      {CUSTOMER_SHIPMENT_TABS.map(tab => (
        <TabsTrigger
          key={tab}
          value={tab}
          className={cn(
            !isDesktop && CHIP_CLASS_NAME,
            tab === 'needsAttention' && (isDesktop ? ATTENTION_TAB_CLASS_NAME : ATTENTION_CHIP_CLASS_NAME),
          )}
        >
          {tab === 'needsAttention' && <TriangleAlert aria-hidden="true" />}
          {intl.formatMessage({ id: `customerShipments.tab.${tab}` }, { count: counts[tab] })}
        </TabsTrigger>
      ))}
    </TabsList>
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (isCustomerShipmentTab(value)) {
          onTabChange(value)
        }
      }}
      className={className}
    >
      <TabsScroller isDesktop={isDesktop}>{tabs}</TabsScroller>
    </Tabs>
  )
}
