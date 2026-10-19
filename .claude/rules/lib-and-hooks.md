---
paths:
  - "src/lib/**/*.ts"
  - "src/hooks/**/*.{ts,tsx}"
  - "src/api/**/*.ts"
---

# Business logic, hooks and API

- `src/lib/` holds pure functions only: no React, no network, no global state. Each one gets unit tests.
- Prefer `es-toolkit` over hand-written utility helpers.
- Hooks are named `useSomething`, live in `src/hooks/` and fetch data with TanStack Query (`useQuery` / `useMutation`), never `useEffect` + `fetch`.
- Query keys are arrays starting with the entity name (`["shipments", filters]`).
- `src/api/` is the only place that knows the HTTP layer (ky client, generated Hey API code in `src/api/generated/`). Map external shapes to domain types at this boundary.
- Validate untrusted data (API responses, search params, environment variables) with zod instead of casting with `as`.
- Never return or pass `null`/`undefined` through call chains: resolve it early or use a discriminated union.
