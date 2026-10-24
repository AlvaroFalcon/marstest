# 0073. Page titles only, no SEO work

- **Date:** 2026-10-23
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Plan
- **Related:** `docs/research/2026-10-23-page-titles.md`, `docs/plans/2026-10-23-page-titles.md`

## Context

The user asked to improve the app's SEO. The research found no meaningful title or description, no Open Graph tags, no indexing policy, soft 404s, a 1 MB single JS bundle and a landing route without `h1`. Before implementing, the user questioned the goal: "¿tiene sentido tener SEO en esta app? Porque son páginas que no vas a descubrir al ser privadas con login" ("does SEO make sense in this app? These pages cannot be discovered, since they are private behind a login", translated). Search engines and link-preview crawlers cannot pass a login, so only the per-page title keeps its value, for usability and accessibility (WCAG 2.4.2).

## Options considered

1. **Full SEO pass** — indexing policy, canonical URL, metadata, code splitting, real 404 statuses. No benefit for pages behind a login.
2. **Metadata and titles** — static description and Open Graph tags plus per-page titles and an exceptions `h1`. Previews would be generic for every URL anyway.
3. **Page titles only** (proposed by Claude as the core worth keeping) — a meaningful `<title>` on every page.

## Decision

Option 3: "ponemos el título en cada página y listo, recortamos a eso" ("we put the title on every page and that's it, we cut it down to that", translated). No new automated tests.

## Consequences

- One message, one small component and a `<title>` per page; no new dependency, environment variable or production domain.
- Titles are not guarded by tests; regressions are caught only by manual or QA review.
- Indexing (`noindex` for the demo), metadata, the exceptions `h1` and code splitting remain open for later if needed.
