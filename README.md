# marstest

React + Vite single-page application built following the MarsBased handbook guidelines, summarised in [`CLAUDE.md`](CLAUDE.md).

## Getting started

```bash
npm ci
cp .env.example .env.local   # optional, fill in the variables you need
npm run dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build |
| `npm run lint` / `npm run lint:fix` | ESLint (incl. formatting) + Stylelint |
| `npm run test` / `npm run test:watch` | Unit and component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright); run `npx playwright install chromium` once first |

## Stack

The handbook stack was installed up front ([ADR 0009](docs/decisions/0009-full-recommended-stack.md));
libraries the app never used were removed later.
Versions are the major lines in [`package.json`](package.json).

### Core

| Library | Version | What it does here |
| --- | --- | --- |
| [React](https://react.dev/) | 19 | UI, function components only |
| [React Compiler](https://react.dev/learn/react-compiler) | 1 | Automatic memoization through a Babel preset in `vite.config.ts`, so there is no `useMemo` / `useCallback` / `memo` |
| [Vite](https://vite.dev/) | 8 | Dev server and production build |
| [TypeScript](https://www.typescriptlang.org/) | 6 | Strict typing everywhere; separate `tsconfig` for tests ([ADR 0016](docs/decisions/0016-separate-tsconfig-for-tests.md)) |

### UI and styling

| Library | Version | What it does here |
| --- | --- | --- |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling with semantic tokens, configured in CSS only (`src/index.css`, no `tailwind.config.ts`) |
| [shadcn/ui](https://ui.shadcn.com/) | 4 | Radix-based primitives copied into `src/components/ui/` as project code ([ADR 0004](docs/decisions/0004-shadcn-ui-for-components.md)) |
| [Radix UI](https://www.radix-ui.com/) | 1 | Accessible behaviour behind the shadcn primitives (popover, sheet, select, tabs, tooltip…) |
| [class-variance-authority](https://cva.style/) | 0.7 | The only mechanism for component variants |
| [cn](https://www.npmjs.com/package/cn) | 0.5 | Class merging through `@/lib/utils` (clsx + tailwind-merge replacement) |
| [Lucide](https://lucide.dev/) | 1 | Icons |
| [sonner](https://sonner.emilkowal.ski/) | 2 | Toasts (for example, after a simulated carrier event) |
| [next-themes](https://github.com/pacocoursey/next-themes) | 0.4 | Dark-mode toggle and the theme sonner reads ([ADR 0037](docs/decisions/0037-keep-next-themes-for-sonner-theme.md)) |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | 1 | Enter and exit animations of the shadcn primitives |
| [Geist](https://vercel.com/font) (`@fontsource-variable/geist`) | 5 | Self-hosted variable font |

### Routing, data and state

| Library | Version | What it does here |
| --- | --- | --- |
| [react-router](https://reactrouter.com/) | 7 | Routing; every path is built through `src/routes.ts` |
| [TanStack Query](https://tanstack.com/query) | 5 | Server state: every read and mutation of the fake shipments API goes through it |
| [TanStack Table](https://tanstack.com/table) | 9 | Headless table behind the desktop shipments table |
| [zod](https://zod.dev/) | 4 | Schemas for the API data, the persisted demo state, search params and `config.ts` |
| [es-toolkit](https://es-toolkit.dev/) | 1 | Utility functions, preferred over lodash and hand-written helpers |
| [react-intl](https://formatjs.github.io/docs/react-intl/) | 12 | Every user-visible string and date (messages in `src/locales/`) |

There is no backend: the data comes from an in-memory fake API seeded in `src/api/seed.ts`
([ADR 0033](docs/decisions/0033-in-memory-fake-api-for-runtime-data.md)), and the demo state is
kept in `sessionStorage` ([ADR 0034](docs/decisions/0034-demo-state-kept-in-session-storage.md)).

### Testing

| Library | Version | What it does here |
| --- | --- | --- |
| [Vitest](https://vitest.dev/) + jsdom | 5 | Unit and component tests, colocated with the code (`Foo.test.tsx`) |
| [React Testing Library](https://testing-library.com/) | 16 | Component tests through roles and labels, with `user-event` for interactions |
| [msw](https://mswjs.io/) | 3 | Network mocks in tests; unhandled requests fail the test |
| [Playwright](https://playwright.dev/) | 1 | E2E tests in `e2e/` against the production build, on desktop Chromium and a mobile Pixel 7 |

### Code quality

| Tool | Version | What it does here |
| --- | --- | --- |
| [ESLint](https://eslint.org/) + [typescript-eslint](https://typescript-eslint.io/) | 10 | Linting, with the react-hooks, react-refresh and TanStack Query plugins |
| [ESLint Stylistic](https://eslint.style/) | 5 | Formatting (single quotes, no semicolons, 2-space indent); there is no Prettier |
| [better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss) | 4 | Tailwind class order, wrapping and invalid classes |
| [Stylelint](https://stylelint.io/) | 17 | CSS linting |

### Tooling and delivery

- **CI**: GitHub Actions ([`.github/workflows/pr-checks.yml`](.github/workflows/pr-checks.yml))
  runs lint, build, unit tests and E2E tests on every pull request.
- **Hosting**: Vercel (see [Deployment](#deployment)).
- **Claude Code**: agents, skills, hooks and scoped rules in `.claude/`, described in
  [`CLAUDE.md`](CLAUDE.md).

## Deployment

The app is hosted on Vercel through the project's Git integration: every push to `main` is deployed to production and every pull request gets a preview deployment. No environment variables are required.

[`vercel.json`](vercel.json) only holds routing and headers; build settings stay in the Vercel project. It rewrites every non-asset path to `index.html` so client-side routes work on reload, caches `/assets/*` for one year as immutable, forces revalidation of everything else (so a new deployment is picked up immediately) and sets `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options` on all routes.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — conventions, project structure, agents and skills.
- [`docs/`](docs/README.md) — Research → Plan → Implement documents and Architecture Decision Records.
