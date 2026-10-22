export type ShipmentsTableColGroupProps = {
  className?: string
}

/**
 * Column widths shared by the ops and customer shipment tables, as shares of the table width.
 * With a fixed table layout the widths come from here instead of the rows on screen, so sorting or
 * changing page never reflows the columns, while the shares keep scaling with the viewport. The
 * last column (the row chevron) takes the remaining 4%.
 */
export function ShipmentsTableColGroup({ className }: ShipmentsTableColGroupProps) {
  return (
    <colgroup className={className}>
      <col className="w-14/100" />
      <col className="w-18/100" />
      <col className="w-21/100" />
      <col className="w-14/100" />
      <col className="w-11/100" />
      <col className="w-18/100" />
      <col />
    </colgroup>
  )
}
