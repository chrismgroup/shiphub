---
name: Charter offer ledger
description: Durable model for auditable owner and charterer negotiation history.
---

Negotiation history is append-only: each offer stores a complete terms snapshot, actor, timestamp, and the prior offer it supersedes. The charter record remains the latest snapshot for fast reads, while the ledger is the source for audit timelines.

**Why:** Updating one charter row cannot show how a commercial proposal changed or establish which party responded to which terms.

**How to apply:** Add new offers through the shared API for both roles, expose history to both parties, and never edit or delete prior offer records as part of normal negotiation.