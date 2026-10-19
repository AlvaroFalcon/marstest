---
paths:
  - "src/**/*.test.{ts,tsx}"
  - "e2e/**/*.ts"
---

# Test files

- Arrange / Act / Assert blocks, visibly separated with comments.
- Test names describe scenario and outcome, never with "should": `it("returns unknown when there is no confirmed milestone")`.
- Render components with `renderWithProviders` from `@/test/renderWithProviders`, never with bare `render`.
- Query by role, label or visible text. No CSS selectors, no `data-testid` unless there is no accessible alternative.
- Mock the network only with msw (`server.use(...)` from `@/test/msw/server`). Never mock `fetch`/`ky` directly.
- Hard-coded expected values, human names ("John Smith"), no random data. Inject dates instead of reading the clock.
- No shared mutable state between tests.
- E2E specs in `e2e/` use only Playwright's user-facing locators (`getByRole`, `getByLabel`, `getByText`).
