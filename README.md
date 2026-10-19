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

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — conventions, project structure, agents and skills.
- [`docs/`](docs/README.md) — Research → Plan → Implement documents and Architecture Decision Records.
