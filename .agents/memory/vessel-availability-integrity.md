---
name: Vessel availability integrity
description: Durable rule for keeping vessel status changes consistent with active charters.
---

Manual vessel edits must not make a vessel available while an active charter exists; this rule applies to every route that can write vessel status, not only a dedicated status endpoint.

**Why:** Availability is used as the gate for new charter enquiries, so bypassing the rule can expose an on-hire vessel to invalid bookings.

**How to apply:** Treat `active` charter records as the source of truth for the guard and return a conflict directing the owner or admin to terminate the charter first.