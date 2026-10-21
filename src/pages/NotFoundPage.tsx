import { FormattedMessage } from 'react-intl'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import routes from '@/routes'

/**
 * Fallback content for any path that does not match a declared route, and for unknown customers
 * inside the shell. It sets no padding or height: the caller (shell gutter or the standalone
 * route wrapper in `Router`) provides the spacing.
 */
export function NotFoundPage() {
  return (
    <main className="flex max-w-3xl flex-col items-start gap-4">
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
