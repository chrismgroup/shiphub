---
name: Charter counter-offers
description: Durable behavior for owner replies that revise charter enquiry terms.
---

An owner counter-offer may change only the amount, conditions, or other supplied terms; omitted enquiry fields must remain unchanged. The update resets both confirmations and notifies the charterer to review the revised proposal.

**Why:** Owners often respond with a partial commercial proposal, and clearing omitted laycan, duration, or cargo details would create an incomplete or misleading charter.

**How to apply:** Treat owner replies as partial updates at the API boundary, then require the normal owner-first confirmation sequence before the charterer accepts.