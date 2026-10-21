import { FormattedMessage } from 'react-intl'

/** Ops exceptions inbox. Placeholder until the inbox milestone; also serves the detail route. */
export function OpsExceptionsPage() {
  return (
    <main className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">
        <FormattedMessage id="opsExceptions.title" />
      </h1>
      <p className="text-muted-foreground">
        <FormattedMessage id="page.comingSoon" />
      </p>
    </main>
  )
}
