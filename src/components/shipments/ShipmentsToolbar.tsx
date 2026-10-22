import { SiteFilter, type SiteFilterOption } from '@/components/shipments/SiteFilter'
import { ShipmentsSearchBox } from '@/components/shipments/ShipmentsSearchBox'
import { ShipmentsSortSelect } from '@/components/shipments/ShipmentsSortSelect'
import { ShipmentsStatusFilter } from '@/components/shipments/ShipmentsStatusFilter'
import type { ShipmentListQuery, ShipmentListStatus, ShipmentSort } from '@/lib/shipmentList'

export type ShipmentsToolbarProps = {
  query: ShipmentListQuery
  siteOptions: SiteFilterOption[]
  /** Shipments across all my sites, shown in the "All my sites" row of the site filter. */
  totalShipmentCount: number
  onSiteChange: (siteId: string | null) => void
  onStatusChange: (status: ShipmentListStatus | null) => void
  onSearch: (search: string) => void
  onSortChange: (sort: ShipmentSort) => void
  /** True on wide layouts: filters open in popovers and sorting is done from the table headers. */
  isDesktop: boolean
}

/**
 * Filters of the shipments list: site, status and search, plus a sort select on narrow layouts
 * where the table headers are not available. Needs an `@container` ancestor (the site filter's
 * trigger label and the search width follow the container).
 */
export function ShipmentsToolbar({
  query,
  siteOptions,
  totalShipmentCount,
  onSiteChange,
  onStatusChange,
  onSearch,
  onSortChange,
  isDesktop,
}: ShipmentsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SiteFilter
        options={siteOptions}
        selectedSiteId={query.siteId}
        totalExceptionCount={totalShipmentCount}
        countKind="shipments"
        onSelect={onSiteChange}
        isDesktop={isDesktop}
      />
      <ShipmentsStatusFilter selectedStatus={query.status} onSelect={onStatusChange} isDesktop={isDesktop} />
      {!isDesktop && <ShipmentsSortSelect sort={query.sort} onSortChange={onSortChange} className="w-full" />}
      <ShipmentsSearchBox
        value={query.search}
        onSearch={onSearch}
        className="
          w-full
          @3xl:ml-auto @3xl:w-96
        "
      />
    </div>
  )
}
