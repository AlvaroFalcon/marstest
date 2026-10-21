# 0062. Pages not yet built show their heading and a "Coming soon" line

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M4, M7, M11, M13)

## Context

M4 adds the app shell before the real pages exist: the exceptions inbox (M7), all shipments (M11) and the customer shipments list (M13) are still to be built. The routes need content in the meantime.

Reason not stated.

## Options considered

1. **Heading plus a neutral "Coming soon" line; the customer stub also shows the customer's name** (proposed by Claude, marked Recommended).
2. **Heading only.**

## Decision

Stub pages show their heading and a neutral "Coming soon" line. The customer stub also shows the customer's name.

## Consequences

- Each stub is replaced by its milestone's real page; the stub text is removed then.
- Showing the customer's name lets a reviewer confirm the role switch reached the right customer before M13.
- Stubs are not counted as complete features in the M4 acceptance criteria.
