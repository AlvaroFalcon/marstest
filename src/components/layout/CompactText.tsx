export type CompactTextProps = {
  /** Complete text: the only copy exposed to assistive technology. */
  full: string
  /** Shorter visual copy shown while the nearest `@container` is narrower than `@md`. */
  compact: string
  className?: string
}

/**
 * Text with a compact variant for narrow containers. The full text is always the accessible name
 * (visually hidden when the compact copy is shown) and the compact copy is `aria-hidden`, so every
 * element exposes exactly one name. Needs an `@container` ancestor.
 */
export function CompactText({ full, compact, className }: CompactTextProps) {
  return (
    <span className={className}>
      <span aria-hidden="true" className="@md:hidden">{compact}</span>
      <span className="
        sr-only
        @md:not-sr-only
      "
      >
        {full}
      </span>
    </span>
  )
}
