---
name: Final charter agreement
description: Durable rule for generating and preserving the final charter agreement.
---

The final agreement is generated exactly once when the owner and charterer have both confirmed the latest offer. It is a persisted snapshot of the mutually accepted terms and remains unchanged when the owner later activates or terminates the hire.

**Why:** The agreement must represent what both parties accepted, not later operational status changes or a mutable current charter row.

**How to apply:** Generate it in the second-confirmation path, make it available only to the participating parties, and treat its stored content as immutable.