# Research: Shipment visibility prototype

- **Date:** 2026-10-20
- **Slug:** `shipment-visibility-prototype`
- **Status:** Reviewed

## Goal

Define what the tech-test prototype must show and how. The test asks for a frontend-only clickable prototype for an industrial manufacturer that ships from several sites, by road and sea, through several carriers. It serves two roles. **Customers and subsidiaries** need to know, without calling anyone, where a shipment is, whether it is on time and when it will arrive. **Internal operations** need the system to surface what needs attention and guide them to resolve it. AI must be a visible, central part of the product, and the prototype must never invent statuses or ETAs: it must always separate confirmed data from estimates.

Inputs: the tech-test brief (requirements, kept outside the repository) and [2026-10-19-competitive-research-shipment-visibility.md](2026-10-19-competitive-research-shipment-visibility.md) (market patterns).

## Current state

The repository only contains the project setup. No feature code exists yet.

| Area | Files | Notes |
| --- | --- | --- |
| App shell | `src/main.tsx`, `src/App.tsx`, `src/Router.tsx`, `src/routes.ts` | Providers and routing ready; only `HomePage` and `NotFoundPage` exist. |
| Config | `src/config.ts` | Zod-validated env config. |
| UI primitives | `src/components/ui/button.tsx`, `src/index.css` | shadcn/ui (Nova preset) and Tailwind v4 tokens; dark mode tokens on `.dark`. |
| i18n | `src/locales/en.ts` | react-intl messages. |
| Tests | `src/test/*`, `e2e/home.spec.ts` | Vitest + RTL + msw, Playwright. |
| Mockups | Pencil document (see "Screens" below) | 5 distinct screens plus 2 overlays, drawn as 21 frames (states and 390 px mobile versions), both roles. Not saved to disk yet. |

## Product scope (agreed in this research)

### AI and product features

| # | Feature | Role | How it is presented | Production approach (for the write-up) |
| --- | --- | --- | --- | --- |
| 1 | Status normalisation | Ops | Source events panel: raw carrier message → normalised status, "Mapped by rule" or "Mapped by AI · N%"; low confidence goes to human review | Deterministic rules first, LLM with structured output only for unknown messages, raw event always stored |
| 2 | Predicted ETA next to the carrier ETA | Both | Two cards / columns: "Carrier ETA" (with source and freshness) and "Our estimate" (date + confidence %), plus a one-line "Why" | A statistical/ML model computes the ETA; the LLM only explains why it changed. Carrier and lane reliability feed the confidence |
| 3 | Document validation | Ops only | Document check against the ERP order (missing certificate of origin, HS code mismatch, weight mismatch) → diagnosis of the hold + proposed action | LLM extraction + rule cross-checks, orchestrated as a workflow with human approval |
| 4 | Prioritised exceptions inbox + next action | Ops | Inbox ordered by urgency; detail with AI diagnosis and an AI draft (approve / discard); other actions incl. "Upload certificate of origin" | LLM drafts from templates and shipment data; nothing is sent without human approval |
| 5 | Visible freshness + live milestone | Both | "Updated X ago" / "No update for X h"; a manual "Simulate carrier event" button in the demo strip | Webhooks when available, polling otherwise, pushed to the browser via SSE |
| 6 | Natural-language summary | Customer | "AI summary" block in the shipment detail | LLM summarises existing events only, citing them |

Delay prediction states (ops shipment detail):

- **On track:** estimate in line with the carrier ETA, no label noise.
- **Suspected delay (< 75 % confidence):** status "Watching", customer not alerted, suggested low-cost step (ask the carrier to confirm).
- **Predicted delay (≥ 75 %):** exception opened automatically, customer notice drafted for review.

### Screens (mockups)

Five distinct screens and two overlays. The extra frames are states of the same screen and the mobile versions.

| Role | Screen | States drawn | Frames (desktop / mobile) |
| --- | --- | --- | --- |
| Ops | Exceptions: inbox + exception detail (home) | Customs hold open; new event highlighted | Ops 1 / Ops M1, M2 |
| Ops | All shipments (table on desktop, cards on mobile) | — | Ops 3 / Ops M4 |
| Ops | Shipment detail without exception | On track · suspected delay · predicted delay | Ops 4–6 / Ops M5–M7 |
| Ops | Overlay: source events panel | — | Ops 2 / Ops M3 |
| Ops | Overlay: site filter (popover / bottom sheet) | Open | Ops 1b / Ops M1b |
| Customer | Your shipments (table on desktop, cards on mobile) | Proactive alert | Customer 1 / Customer M1 |
| Customer | Shipment detail | At risk · delivered | Customer 2–3 / Customer M2–M3 |

Total: 21 frames (10 desktop, 11 mobile). The exception detail and the ops shipment detail are one screen with an exception layer.

Shared elements: header with a demo strip ("Simulate carrier event") and a "Viewing as" role switch; ops tabs "Exceptions · All shipments"; the ops user's scope is visible ("Ops · Spain sites", filter "All my sites (3)", out-of-scope site locked).

Out of scope: route optimisation, carrier scorecard screen, freight cost auditing, Incoterms, customer document upload, real login, maps.

### Visual language

- Provenance labels only when a date is not plain carrier data: "Carrier ETA", "Estimated · N %", "Derived from GPS", "No update for X h". Past milestones reported by the carrier carry no label.
- All AI-generated content uses one blue block style labelled "AI …" with a "Based on N events" link.
- The carrier ETA is always shown, with its source and freshness ("Source: EuroRuta API · updated 12 min ago"). Our estimate always shows a date and a confidence %. Black estimate = in line with the carrier; blue = deviates.
- In tables, confidence is its own sortable column next to "Our estimate".
- Status is never conveyed by colour alone (badges always have text and an icon).
- Inbox cards: white card on the page background, thin border, soft shadow, inner left status bar. Light blue = row open in the detail; light yellow = event just received.

## Dependencies and constraints

- Frontend only, synthetic data, simulated AI (tech-test brief, constraints section). Max 8 hours.
- Stack fixed by `CLAUDE.md` §2: React 19 + Vite, shadcn/ui, Tailwind v4, react-router, TanStack Query, TanStack Table v9, zod, react-intl, msw.
- URL state for view state (page, filters, sort) per `CLAUDE.md` §5.
- Deployed on Vercel; written document max 4 pages.
- Accessibility: WCAG AA contrast, keyboard navigation, minimum 12 px text.

## Gaps

- No domain model, mock data, pages or components exist yet.
- No route structure for the role switch (`/ops/...`, `/customer/...`).
- Pending behaviour for the plan (from the UI/UX audit):
  1. Close the demo story: approving the draft shows a toast, marks the row "Customer notified" and drives the customer alert.
  2. Notify ops of new exceptions after "Simulate carrier event" (toast + "New" marker).
  3. Enforce a 12 px minimum text size.
- The Pencil mockups are not saved to disk yet: Pencil hangs when saving and the connector has no save command. Target location: `docs/mockups/` (folder created).

## Risks and tricky parts

- **Scope vs 8 hours:** 5 screens and 2 overlays, each in desktop and mobile. In code, the ops shipment detail (three states) and the exception detail must be one data-driven component; the customer and ops lists share one table component and one card component.
- **Reliability rule:** every ETA shown must have a visible source; the carrier ETA is never hidden or replaced.
- **Buttons that do nothing:** every visible action needs a simulated effect or must be removed.
- **Mockups lost:** the Pencil document only lives in memory until it is saved.

## Open questions

- [x] Mock data volume: keep the agreed seed of 15–20 shipments for 3 customers. The counts in the mockups ("142", "24") are only illustrative.
- [x] Geofence-detected milestone ("Detected by geofence · not yet confirmed by carrier"): write-up only, to keep the scope within the time budget.

## References

- [2026-10-19-competitive-research-shipment-visibility.md](2026-10-19-competitive-research-shipment-visibility.md)
- LangGraph docs (Context7 `/websites/langchain_oss_python_langgraph`): `interrupt()` + checkpointer for human-in-the-loop approval
- `CLAUDE.md` §2 (stack), §5 (URL state), §7 (styling)
