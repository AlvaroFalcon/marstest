import { FormattedMessage } from 'react-intl'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import routes from '@/routes'

/** Fallback page rendered for any path that does not match a declared route. */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">
        <FormattedMessage id="notFound.title" />
      </h1>
      <Button asChild>
        <Link to={routes.home()}>
          <FormattedMessage id="notFound.backHome" />
        </Link>
      </Button>
    </main>
  )
}
