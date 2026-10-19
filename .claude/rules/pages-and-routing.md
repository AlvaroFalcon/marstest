---
paths:
  - "src/pages/**/*.tsx"
  - "src/Router.tsx"
  - "src/routes.ts"
---

# Pages and routing

- Pages are named `<Name>Page.tsx` and their folders mirror the URL hierarchy (`src/pages/admin/AdminUserListPage.tsx`).
- Every path is declared in `src/routes.ts` and consumed through it, both in `Router.tsx` and in `<Link>`. No hard-coded path strings.
- Pages only arrange feature components and read route/search params; data fetching lives in hooks (`src/hooks/`).
- Search params are parsed with one zod schema per route, defaults in the schema; omit params equal to their default; changing a filter resets pagination to page 1.
- Every new route gets at least one Playwright spec in `e2e/` covering its critical path.
