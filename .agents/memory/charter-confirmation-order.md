---
name: Charter confirmation order
description: Durable role order for ShipHub charter enquiries and confirmations.
---

New charter enquiries belong to the ship owner for first review. The charterer may edit or decline an open enquiry, but may only confirm after the owner has confirmed the terms. Once both parties confirm, only the owner can activate or terminate the hire.

**Why:** The Charterer marketplace must not present an enquiry sender with owner-only responsibility immediately after submission; the owner’s response is the handoff that makes acceptance meaningful.

**How to apply:** Enforce the order in both the role-specific UI and the API route, and notify the other party after each confirmation so the next action is clear.