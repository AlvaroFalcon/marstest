# 0071. Exception detail header shows tracking freshness, not carrier ETA update time

- **Date:** 2026-10-21
- **Status:** Accepted
- **Decided by:** User, on Claude's proposal
- **Phase:** Implement
- **Related:** `docs/plans/2026-10-20-shipment-visibility-prototype.md` (M8), `docs/implementation/2026-10-20-shipment-visibility-prototype.md`, [0043](0043-freshness-two-levels-by-receipt-time.md), [0026](0026-carrier-eta-always-visible-and-estimate-confidence.md)

## Context

The OPS mockup of the exception detail header shows "Updated 2 h ago · Mareline EDI". Seed shipment SH-1042 has its last tracking event 25 hours old (stale under [0043](0043-freshness-two-levels-by-receipt-time.md)), while its carrier ETA was refreshed 12 minutes ago. The header therefore has two possible freshness sources that disagree for this shipment.

## Options considered

1. **Tracking freshness, reusing `FreshnessIndicator`** (proposed by Claude, recommended). Stale shows the stale badge ("No update for X h"); fresh shows "Updated X ago". Also shows the carrier and channel of the latest raw event. Consistent with the inbox and never hides staleness.
2. **Carrier ETA update time and source**, matching the mockup shape. Duplicates the note already shown on the ETA card.

## Decision

The exception detail header shows tracking freshness through `FreshnessIndicator`, plus the carrier and channel of the latest raw event. It does not show the carrier ETA update time.

The user's answer at the decision gate: "Tracking freshness (Recommended)". No reason was given in free text; the user selected the recommended option.

## Consequences

- SH-1042 shows the stale state in the header, the same as in the inbox.
- The header differs from the mockup text "Updated 2 h ago · Mareline EDI" for this seed case.
- The carrier ETA freshness remains only on the `EtaPair` card, so the two freshness values are not shown in the header.
- Any future request to show ETA update time in the header is a change of this decision.
