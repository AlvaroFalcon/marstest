import { FormattedMessage, useIntl } from 'react-intl'
import { Link } from 'react-router'
import { DocumentTitle } from '@/components/layout/DocumentTitle'
import { Button } from '@/components/ui/button'
import routes from '@/routes'

/**
 * Fallback content for any path that does not match a declared route, and for unknown customers
 * inside the shell. It sets no padding or height: the caller (shell gutter or the standalone
 * route wrapper in `Router`) provides the spacing.
 */
export function NotFoundPage() {
  const intl = useIntl()

  return (
    <main className="flex max-w-3xl flex-col items-start gap-4">
      <DocumentTitle page={intl.formatMessage({ id: 'notFound.title' })} />
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
