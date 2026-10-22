import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

export type DetailBackLinkProps = {
  href: string
  /** Visible text ("Exceptions"). */
  label: string
  /** Full accessible name ("Back to exceptions"), because the visible text is short. */
  accessibleLabel: string
}

/** "← Label" link above a shipment detail that replaces a list (narrow layouts, or the shipment page). */
export function DetailBackLink({ href, label, accessibleLabel }: DetailBackLinkProps) {
  return (
    <Link
      to={href}
      aria-label={accessibleLabel}
      className="
        inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-hidden
        hover:text-foreground
        focus-visible:ring-3 focus-visible:ring-ring
      "
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </Link>
  )
}
