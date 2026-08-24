---
name: Vessel deletion policy
description: Safety and data-integrity rules for removing a vessel listing.
---

Vessel removal is an explicit owner/admin action, never an automatic update side effect. It is blocked while the vessel has an active charter; after termination, the requested deletion removes that vessel and its closed charter dependencies in one transaction.

**Why:** Owners need to remove vessels that leave their fleet, but a live charter must not be interrupted and foreign-key-linked records must not be orphaned.

**How to apply:** Keep authorization scoped to the vessel owner or an admin, require a visible irreversible-action confirmation, preserve the active-charter block, and never use listing deletion as part of an update, deploy, or database schema process.