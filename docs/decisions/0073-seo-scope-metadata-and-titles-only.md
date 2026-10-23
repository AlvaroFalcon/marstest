# 0073. SEO work is limited to metadata and page titles

- **Date:** 2026-10-23
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Research
- **Related:** `docs/research/2026-10-23-seo.md`, `docs/plans/2026-10-23-seo.md`

## Context

The SEO research found several gaps: no meaningful title or description, no Open Graph tags, no indexing policy (`robots.txt`, sitemap, canonical), a 1 MB single JS bundle, soft 404s (every URL returns HTTP 200) and a landing route without `h1`. The user narrowed the work: "dejamos esto fuera, me interesa más el tema de los metatags, el título y demás" ("we leave this out, I care more about the meta tags, the title and so on", translated). They then accepted the proposed scope "except the tests".

## Options considered

1. **Full SEO pass** — indexing policy, canonical URL with a `VITE_SITE_URL` variable, code splitting, real 404 statuses, metadata and titles. Broad; needs a production domain and duplicates `routes.ts` in `vercel.json`.
2. **Metadata and titles only** (proposed by Claude) — static description, text-only Open Graph / Twitter tags and `theme-color` in `index.html`, per-page `<title>`, a screen-reader `h1` on the exceptions inbox.

## Decision

Option 2, without new automated tests. No indexing policy, canonical URL, preview image, performance work, HTTP 404 statuses or prerendering.

## Consequences

- No production domain or new environment variable is needed.
- Link previews are text only and identical for every route, because crawlers read only the static `index.html`.
- Titles and metadata are not guarded by tests; regressions are caught only by manual or QA review.
- Indexing, code splitting and 404 handling remain open topics for a later feature.
