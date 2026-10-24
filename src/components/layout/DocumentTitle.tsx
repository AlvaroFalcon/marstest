import { useIntl } from 'react-intl'

export type DocumentTitleProps = {
  /** Name of the page or, on a detail page, the shipment id. The site name is appended. */
  page: string
}

/**
 * Sets the browser tab title to "<page> · Shipment visibility".
 *
 * Relies on React 19 hoisting: a `<title>` rendered anywhere is inserted into `<head>` before the
 * static `<title>` of `index.html`, so it wins. The static one stays as the fallback for the
 * moment before JavaScript runs.
 *
 * Render exactly one per visible state: two at once would leave the winner undefined.
 */
export function DocumentTitle({ page }: DocumentTitleProps) {
  const intl = useIntl()

  // React requires a single string child, so the message is formatted here and not interpolated in JSX.
  return <title>{intl.formatMessage({ id: 'documentTitle.page' }, { page })}</title>
}
