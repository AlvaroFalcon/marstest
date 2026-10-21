# CLAUDE.md

Project guide for Claude Code. Based on the MarsBased handbook guidelines (React, TypeScript, CSS, testing, coding, code review and git), Vite SPA variant. React Native and Next.js sections of the handbook do **not** apply to this project.

## 0. Non-negotiable rules

- **Everything is written in English**: code, identifiers, comments, JSDoc, commit messages, PR titles/bodies, docs, agent and skill files. No exceptions, even if the conversation happens in another language.
- Follow the **Research → Plan → Implement** workflow (section 3) for any non-trivial change.
- Never invent requirements. If a decision has several valid options, ask before choosing.
- Keep changes small and focused: one thing at a time, no unrelated refactors mixed into features.

## 1. Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run lint` | ESLint (incl. Stylistic formatting and Tailwind class rules) + Stylelint |
| `npm run lint:fix` | Auto-fix everything ESLint and Stylelint can fix |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Unit/component tests with Vitest (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright E2E tests (desktop + mobile) against the production build; set `PLAYWRIGHT_BASE_URL` to test a deployed URL |
| `npx shadcn@latest add <component>` | Add a shadcn/ui primitive to `src/components/ui/` |

Before declaring any task done: `npm run build`, `npm run lint` and `npm run test` must pass; run `npm run test:e2e` when routes or critical paths change.

## 2. Tech stack

All installed (decided in `docs/decisions/0009-full-recommended-stack.md`).

| Concern | Library |
| --- | --- |
| Framework | React 19, Vite 8, TypeScript 6, [React Compiler](https://react.dev/learn/react-compiler) (Babel preset) |
| Components | [shadcn/ui](https://ui.shadcn.com/) — Radix base, Nova preset, Lucide icons (copied into `src/components/ui/`). The `shadcn` package is a runtime dependency only because `src/index.css` imports `shadcn/tailwind.css`; class merging uses the `cn` package (shadcn's clsx + tailwind-merge replacement) through `@/lib/utils` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first config in `src/index.css`, no `tailwind.config.ts`) |
| Routing | [react-router](https://reactrouter.com/) v7 |
| Server state / fetching | [TanStack Query](https://tanstack.com/query) v5 |
| Global client state | [zustand](https://github.com/pmndrs/zustand) (only if Context is not enough) |
| Theme | [next-themes](https://github.com/pacocoursey/next-themes) — installed by the shadcn `sonner` primitive to read the current theme; also drives the dark-mode toggle (`docs/decisions/0037-keep-next-themes-for-sonner-theme.md`) |
| Toasts | [sonner](https://sonner.emilkowal.ski/) through the shadcn `sonner` primitive |
| Forms | [react-hook-form](https://react-hook-form.com/) + `@hookform/resolvers` (pinned to `~5.2.2`: from 5.4.3 its optional peer dependencies make npm write a lockfile that `npm ci` rejects) |
| Validation | [zod](https://zod.dev/) v4 |
| Tables | [TanStack Table](https://tanstack.com/table) v9 + shadcn `Data Table` |
| HTTP | [ky](https://github.com/sindresorhus/ky) |
| Utilities | [es-toolkit](https://es-toolkit.dev/) (prefer over lodash and hand-written helpers) |
| i18n | [react-intl](https://formatjs.github.io/docs/react-intl/) (messages in `src/locales/`) |
| Testing | [Vitest](https://vitest.dev/) + jsdom, [React Testing Library](https://testing-library.com/), [msw](https://mswjs.io/) v3, [Playwright](https://playwright.dev/) |
| Lint/format | ESLint with [ESLint Stylistic](https://eslint.style/) (no Prettier), react-hooks, TanStack Query plugin, [better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss); [Stylelint](https://stylelint.io/) for CSS |

Not installed until needed: [Hey API](https://heyapi.dev/) (when an OpenAPI spec exists; output in `src/api/generated/`) and [nuqs](https://nuqs.dev/) (routes with many search params).

Code style: single quotes, no semicolons, 2-space indent — enforced by ESLint Stylistic, never by hand.

Use the Context7 MCP to fetch up-to-date docs for any of these libraries before writing code against them: several have breaking majors newer than most training data (msw v3 uses `onUnhandledFrame`, TanStack Table v9 uses `useTable` + `tableFeatures`).

## 3. Workflow: Research → Plan → Implement (RPI)

Each phase runs in a fresh context window and produces a document. All three documents of one feature share the same slug: `YYYY-MM-DD-<feature-slug>.md`.

| Phase | Output folder | What happens | Human checkpoint |
| --- | --- | --- | --- |
| **Research** | `docs/research/` | Map the codebase, dependencies, constraints and open questions. **No code is written.** | Are we solving the right problem? |
| **Plan** | `docs/plans/` | Numbered steps referencing specific files, acceptance criteria, test strategy. Ask the user when a decision has several valid options. | Is the approach sound? |
| **Implement** | `docs/implementation/` | Follow the plan step by step. Log progress and **every deviation with its reason**. Verify against acceptance criteria. | Does it match the requirements? |

Cross-cutting: `docs/decisions/` is the log of the user's decisions, written by the `decision-recorder` agent during every phase. Claude's own technical choices are explained in commit messages, code comments or this file, not there.

Templates live in each folder as `_TEMPLATE.md`. Split large implementations into chunks, each in its own context window.

## 4. Project structure (Vite SPA, handbook §2.2)

```
src/
|- main.tsx               # entry point (createRoot)
|- App.tsx                # application setup (providers)
|- Router.tsx             # BrowserRouter and Routes
|- routes.ts              # typed route helpers — every app path lives here
|- config.ts              # single application configuration file
|- pages/                 # page components, mimic the URL hierarchy
|  |- HomePage.tsx
|  |- ShipmentListPage.tsx
|  |- admin/
|     |- AdminUserListPage.tsx
|- components/            # non-route components (nestable)
|  |- ui/                 # shadcn/ui primitives (project code, editable)
|- hooks/                 # all custom hooks (may expose Providers)
|- locales/               # i18n messages
|- api/                   # REST client (generated/ + hand-written config)
|- auth/                  # auth service (if needed)
|- lib/                   # pure utilities and business logic (utils.ts = shadcn cn helper)
|- test/                  # test infrastructure: setup.ts, msw/ server + handlers, renderWithProviders
e2e/                      # Playwright specs (*.spec.ts)
```

Rules:
- Import from `src` with the `@/` alias (`import { Button } from '@/components/ui/button'`).
- Pages are named `<Name>Page.tsx` and mirror the URL hierarchy.
- One folder per external service (`api/`, `auth/`, ...), each exposing a clean interface.
- Business logic goes in pure functions under `lib/` so it can be unit-tested without React.
- Tests are colocated: `Foo.tsx` → `Foo.test.tsx`. E2E tests live in `e2e/`.
- Environment variables are prefixed `VITE_`, documented in `.env.example` and validated with zod in `config.ts`.

### Routes

```ts
// src/routes.ts
export default {
  home: () => `/`,
  shipments: () => `/shipments`,
  shipment: (id: string) => `/shipments/${id}`,
  admin: {
    users: () => `/admin/users`,
  },
}
```

Use `routes.shipment(shipment.id)` in `<Link>` and `routes.shipment(':id')` in `Router.tsx`. Never hard-code a path string elsewhere.

## 5. React conventions (handbook §1)

1. **TypeScript everywhere.**
2. **Function components only**, written as **function declarations** (not arrow functions).
3. **Named exports** only. No default exports (exception: `routes.ts`, which follows the handbook example).
4. **Named, exported prop types**: `export type LoginFormProps = { ... }`. Never `React.FC` or inline anonymous prop types.
5. **Hooks for state.** Priority for global state: server state (TanStack Query) → URL state → Context → zustand. No Redux.
6. **Extract substantial compositions** into named components, even if used once when complex.
7. **No manual memoization** (`useMemo`, `useCallback`, `memo`) unless profiling shows a need. The React Compiler (enabled in `vite.config.ts`) handles it.
8. Resolve nullable props **once in the parent**; children receive non-null data.

```tsx
export type ShipmentStatusBadgeProps = {
  status: ShipmentStatus
  /** True when the status comes from a system estimate rather than the carrier. */
  isEstimated: boolean
}

/**
 * Displays the delivery status of a single shipment as a coloured badge.
 * Estimated values are visually distinguished from operator-confirmed ones.
 */
export function ShipmentStatusBadge({ status, isEstimated }: ShipmentStatusBadgeProps) {
  // ...
}
```

### URL state (handbook §3.1.3)

- Search params hold view state (page, filters, search, sort). The path holds identity (`/shipments/42`).
- Parse and validate search params with **one zod schema per route**, defaults defined in the schema.
- Omit params equal to their default. Changing a filter or search resets pagination to page 1.
- Use react-router's `useSearchParams` (or nuqs if a route has many params). Never put secrets or large payloads in the URL.

### Data fetching (handbook §3.2, §3.4)

- Declarative fetching with TanStack Query. No `useEffect` + `fetch`.
- Generate REST types/clients with Hey API; hand-write only the client configuration.

## 6. TypeScript conventions

1. Type data at its source (API responses, generated types) and derive the rest with utility types: `type CreateUserForm = Partial<Pick<User, 'email' | 'name'>>`.
2. Prefer `type` over `interface` (use `interface` only for declaration merging).
3. Explicit return types on non-obvious functions.
4. Named, exported types. No inline object types.
5. **No `as` casting** and no `any`. Use type guards, assertion functions or zod.
6. Handle `null`/`undefined` as early as possible; use defaults (`??`) or discriminated unions (`{ ok: true; value } | { ok: false; error }`).

## 7. Styling (handbook CSS guidelines, summary)

- Tailwind v4 configured in CSS (`@import "tailwindcss"`, `@theme`). shadcn/ui components are project code: map their colours to tokens and replace `transition-all`.
- Components use **semantic tokens** (`bg-primary`), never raw palette classes (`bg-neutral-200`) or arbitrary colour/spacing values.
- Theme via custom properties on `:root` redefined in `.dark` (`src/index.css`). No `dark:` class chains in our components (generated shadcn primitives in `components/ui/` may keep theirs).
- Compose classes with `cn()`, caller's `className` last. Components set no outer margin; parents control spacing with `gap`.
- State through attributes (`aria-expanded`, `data-state`), not `.is-open` classes. No `!important`, no IDs in selectors.
- `rem` for spacing/type, `svh` instead of `vh`, unitless `line-height`, never `transition: all`.
- Keep visible focus on `:focus-visible` (`outline-hidden`, not `outline-none`).
- Gate transform-based motion and smooth scrolling behind `prefers-reduced-motion: no-preference` (Tailwind `motion-safe:`). **Never** add a global rule that disables all animations.
- Mobile-first, intrinsic layouts and container queries over breakpoints. Responsive values change in the token layer (`clamp()` for fluid sizes), not through breakpoint chains in components.
- Tokens in three tiers: primitives, semantic roles (`--primary`) and component knobs only when needed. Colours in `oklch()`; hover/active shades derived with `color-mix(in oklch, ...)`, never hard-coded.
- Tailwind v4 is configured in CSS only: primitives in `@theme`, semantic aliases in `@theme inline`, custom utilities in `@utility`. Use `@apply` only on elements in `base`, never to build `.btn`-style classes.
- Arbitrary values (`[...]`) only for computed values, child selectors and grid templates; a bracketed colour, spacing or font value means a token is missing.
- One variant mechanism: `cva`. Class order and wrapping are handled by ESLint, never by hand.
- Name transitioned properties (never `transition-all`); durations and easings come from tokens. Hover styles apply only on devices that can hover.
- z-index values come from a named token scale (no `9999`); use `isolation: isolate` for stacking contexts.
- Inline styles only for runtime values, passed as custom properties. Comment the origin of every magic number.
- Fonts are self-hosted `woff2` with `font-display: swap`.

## 8. Comments and documentation

- Every exported component, hook, function and type has a **meaningful JSDoc** block: purpose, non-obvious parameters, return value, side effects, and the *why* when it is not evident. Do not restate what the code literally does.
- Inline comments explain **why**, never **what**.
- No commented-out code (git keeps history). No `TODO` comments: open an issue instead.
- Long, descriptive names. Never single-character identifiers (loop indexes included where a name adds clarity).

## 9. Testing (handbook testing guidelines)

- Vitest + React Testing Library for unit/component tests, Playwright for E2E, msw for network mocks (unhandled requests fail the test).
- Render components with `renderWithProviders` (`src/test/renderWithProviders.tsx`); override network responses per test with `server.use(...)`.
- Favour E2E for critical user paths; unit-test pure business logic in `lib/`.
- Arrange / Act / Assert, separated by a blank line (no `// Arrange` / `// Act` / `// Assert` comments). Boring, explicit tests; hard-coded expected values; human names ("John"), no random data.
- Test behaviour through the public interface (queries by role/label, not CSS classes or internals).
- Test names without "should": `it("returns only the first name when last name is missing")`.
- No shared state between tests. Fix or delete flaky tests immediately.

## 10. Git and pull requests

- Branches: `feat/<short-description>` or `fix/<short-description>` (or `feat/<ISSUE-ID>` when an issue-tracker ID exists).
- Squashed commit format: `[ISSUE-CODE] <type>(<scope>): <subject>` — types: `feat`, `fix`, `chore`, `docs`, `test`, `deploy`. Header ≤ 72 chars, body lines ≤ 100. Issue code may be omitted when there is no issue.
- Squash and merge feature branches. Never `git push -f` on shared branches; use `--force-with-lease`.
- Every milestone of an approved plan is implemented with the `implement-milestone` skill: the main session coordinates, the agents implement, and every choice the plan does not settle is asked to the user, never decided silently.
- The user reviews the changes before the PR is opened. Every PR is created with the `create-pull-request` skill so the body always follows the same structure.
- Automated review: adding the `ready-to-test` label triggers a Claude Code routine that runs the `review-pull-request` skill. It runs `code-reviewer` and `qa-reviewer` in parallel, posts **one** combined GitHub review and removes the label (add it again to re-run).
- Review comments use "we", give an objective reason and propose an alternative.

### Continuous integration

| Workflow | Trigger | Jobs |
| --- | --- | --- |
| `.github/workflows/pr-checks.yml` | Every pull request (opened, new commits, reopened, ready for review) | `Lint` (`npm run lint`), `Build` (`npm run build`), `Unit tests` (`npm run test`), `E2E tests` (`npm run test:e2e`, report uploaded on failure) |

- Workflows only call npm scripts, so a check that passes locally passes in CI. Node version comes from `.nvmrc`.
- New or changed workflows are done by the `devops-expert` agent.

## 11. Agents

Located in `.claude/agents/`. Invoke them for isolated, well-defined tasks with a clear deliverable.

| Agent | What it does | When to use it | Skills it uses |
| --- | --- | --- | --- |
| `react-vite-expert` | Implements features in React + Vite following this file to the letter, with meaningful JSDoc on every exported symbol. Returns every open choice to the caller instead of deciding it. | Implement phase of RPI (through `implement-milestone`) for any logic, hook, page, routing, data-fetching or state work. | `design-patterns` when a recurring design problem appears; `create-pull-request` when the feature is ready. |
| `ui-ux-expert` | Designs and builds accessible, responsive UI using shadcn/ui + Tailwind tokens. | Any new screen, component, layout, visual state (loading/empty/error) or UX review. | `design-patterns` (Composite, Strategy, Adapter for UI variants). |
| `test-expert` | Writes Vitest/RTL unit and component tests and Playwright E2E tests for implemented features. | After each implemented feature or bug fix, and before opening a PR. | `design-patterns` (to recognise seams worth testing). |
| `code-reviewer` | Applies the MarsBased code review checklist (correctness, security, conventions, tests, JSDoc, commit/PR format) and drafts a review, citing a `CLAUDE.md` section or `.claude/rules/` file for every comment. Reads CI results instead of re-running checks. Never deals with screenshots. Read-only; never posts. | Inside `review-pull-request` on every PR, or manually with a PR number or on the current branch. | Checks PRs against the `create-pull-request` structure. |
| `qa-reviewer` | Runs the real app, takes screenshots (stored in the `qa-screenshots` branch), validates the PR's acceptance criteria and returns the report with screenshots embedded. Never posts. | Inside `review-pull-request` (routine on the `ready-to-test` label), or manually with a PR number. | Reads the structure defined by `create-pull-request`. |
| `devops-expert` | Implements and maintains GitHub Actions workflows and CI/CD setup: SHA-pinned actions, least-privilege permissions, caching, parallel jobs. | Whenever the user asks for a new workflow (checks, deploys, scheduled jobs) or a CI run fails for infrastructure reasons. | — |
| `decision-recorder` | Records in `docs/decisions/` the decisions **the user** takes (choices, scope cuts, preferences) and the ideas proposed by Claude that the user adopts, with the user's reasons. Claude's own decisions are never recorded. | In the background right after the user decides something and at the end of every RPI phase. It does not see the conversation: pass it the decision, the options and the user's words. | — |

## 12. Skills

Located in `.claude/skills/`. Loaded on demand.

| Skill | What it does | When to use it | Used by |
| --- | --- | --- | --- |
| `design-patterns` | Catalogue of classic design patterns (GoF + React-specific) with TypeScript/React examples, when to use them and when not to. | During Plan or Implement when facing a known problem: varying algorithms, adapting external data, composing behaviour, notifying changes, building complex objects. | `react-vite-expert`, `ui-ux-expert`, `test-expert` |
| `create-pull-request` | Creates a PR with a fixed body: concise title, description, steps to test, expected behaviour and acceptance criteria. | Every time a pull request is opened. | `implement-milestone`, `react-vite-expert`, main session; `qa-reviewer` and `code-reviewer` rely on its structure |
| `implement-milestone` | Runs the Implement phase of one plan milestone: decision gate with the user, delegation to `react-vite-expert` / `ui-ux-expert` / `test-expert`, implementation log, verification, user pre-PR review, PR. | Every milestone of an approved plan. | Main session |
| `review-pull-request` | Runs `code-reviewer` and `qa-reviewer` in parallel, merges their results into one GitHub review (summary, acceptance criteria with screenshots, CI, inline comments) and removes the `ready-to-test` label. Runs in the main session because agents cannot launch other agents. | From the routine on the `ready-to-test` label, or manually with a PR number. | Main session (routine) |

## 13. Claude Code guardrails

| Mechanism | Location | What it does |
| --- | --- | --- |
| Hook `block-sensitive-files` | `.claude/hooks/block-sensitive-files.mjs` (PreToolUse) | Blocks reading, writing or referencing environment files (except `.env.example`), `.netrc`, `.ssh`, `.aws`, `.gnupg`, `.kube`, `.docker`. |
| Hook `lint-fix` | `.claude/hooks/lint-fix.mjs` (PostToolUse) | Runs `eslint --fix` / `stylelint --fix` on every edited file and reports remaining problems so they are fixed immediately. |
| Permission deny rules | `.claude/settings.json` | Second line of defence for secret files. |
| Scoped rules | `.claude/rules/` | Extra instructions loaded only when matching files are touched: `tests.md`, `ui-components.md`, `pages-and-routing.md`, `lib-and-hooks.md`. |

Never try to work around a blocked hook: ask the user to perform the action instead.

## 14. Source of truth

This file and `.claude/rules/` are the **only** source of conventions for this project; no external guide is consulted. If a case is not covered, do not guess from general practice: ask the user, and if a new rule is agreed, add it here.
