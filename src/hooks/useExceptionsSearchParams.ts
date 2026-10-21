import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'

/**
 * Search params of the ops exceptions route. `site` is the origin site id of the filter; absent
 * means "all my sites", which is the default and is therefore never written to the URL. An empty
 * value is treated as absent.
 */
export const exceptionsSearchParamsSchema = z.object({
  site: z.string().min(1).optional().catch(undefined),
})

/** @see exceptionsSearchParamsSchema */
export type ExceptionsSearchParams = z.infer<typeof exceptionsSearchParamsSchema>

/** Result of {@link useExceptionsSearchParams}. */
export type UseExceptionsSearchParamsResult = {
  /** Validated selected site id, or `null` for all my sites. */
  siteId: string | null
  /** Selects a site, or all sites with `null`; the default is omitted from the URL. */
  setSiteId: (siteId: string | null) => void
}

/**
 * Reads and writes the `?site=` filter of the exceptions route. A site that is not one of the
 * in-scope sites (unknown, or the locked out-of-scope one) is treated as "all my sites" and is
 * removed from the URL with `replace`, so the back button does not return to the invalid state.
 * Other search params are preserved.
 *
 * @param inScopeSiteIds - Ids of the sites the ops user may filter by, or `null` while they are
 * not loaded; validation against the scope waits until they are.
 */
export function useExceptionsSearchParams(inScopeSiteIds: readonly string[] | null): UseExceptionsSearchParamsResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const { site } = exceptionsSearchParamsSchema.parse({ site: searchParams.get('site') ?? undefined })

  const isInvalidSite = site !== undefined && inScopeSiteIds !== null && !inScopeSiteIds.includes(site)

  useEffect(() => {
    if (isInvalidSite) {
      setSearchParams(previous => withSite(previous, null), { replace: true })
    }
  }, [isInvalidSite, setSearchParams])

  function setSiteId(siteId: string | null): void {
    setSearchParams(previous => withSite(previous, siteId))
  }

  return { siteId: isInvalidSite ? null : site ?? null, setSiteId }
}

function withSite(previous: URLSearchParams, siteId: string | null): URLSearchParams {
  const next = new URLSearchParams(previous)
  if (siteId === null) {
    next.delete('site')
  }
  else {
    next.set('site', siteId)
  }
  return next
}
