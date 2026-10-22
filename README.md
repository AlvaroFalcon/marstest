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

React 19 · Vite 8 · TypeScript · React Compiler · Tailwind CSS v4 · shadcn/ui · react-router v7 · TanStack Query & Table · zustand · react-hook-form · zod · ky · es-toolkit · react-intl · Vitest · React Testing Library · msw · Playwright.

## Deployment

The app is hosted on Vercel through the project's Git integration: every push to `main` is deployed to production and every pull request gets a preview deployment. No environment variables are required.

[`vercel.json`](vercel.json) only holds routing and headers; build settings stay in the Vercel project. It rewrites every non-asset path to `index.html` so client-side routes work on reload, caches `/assets/*` for one year as immutable, forces revalidation of everything else (so a new deployment is picked up immediately) and sets `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options` on all routes.

To run the E2E tests against a deployed URL:

```bash
PLAYWRIGHT_BASE_URL=https://<deployment-url> npm run test:e2e
```

Preview deployments behind Vercel Deployment Protection answer with a login page, so disable the protection for the project or configure a protection bypass before running the E2E tests against them.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — conventions, project structure, agents and skills.
- [`docs/`](docs/README.md) — Research → Plan → Implement documents and Architecture Decision Records.
