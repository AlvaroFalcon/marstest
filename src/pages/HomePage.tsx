import { FormattedMessage } from 'react-intl'

/** Landing page of the application. */
export function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-2 p-6">
      <h1 className="text-3xl font-semibold">
        <FormattedMessage id="home.title" />
      </h1>
      <p className="text-muted-foreground">
        <FormattedMessage id="home.subtitle" />
      </p>
    </main>
  )
}
