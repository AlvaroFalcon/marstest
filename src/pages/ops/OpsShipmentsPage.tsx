import { FormattedMessage } from 'react-intl'

/** Ops "All shipments" list. Placeholder until the list milestone; also serves the detail route. */
export function OpsShipmentsPage() {
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">
        <FormattedMessage id="opsShipments.title" />
      </h1>
      <p className="text-muted-foreground">
        <FormattedMessage id="page.comingSoon" />
      </p>
    </main>
  )
}
