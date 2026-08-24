---
name: Split ShipHub workspaces
description: Product-boundary decision for the Owner and Charterer mobile artifacts.
---

ShipHub Owners and ShipHub Charterer are independent role-specific apps. The intended production connection is through ShipHub’s public API contract and its configured API authentication, not by making the Owner frontend a dependency of the Charterer workspace.

**Why:** The two apps may live in separate workspaces and release independently; the Charterer app should consume the Owner platform through a stable public interface rather than sharing frontend code or requiring the Owner artifact to be restored locally.

**How to apply:** Do not restore ShipHub Owners into the Charterer workspace unless a local preview is explicitly requested. Configure Charterer against the Owner API’s documented base URL and authentication through server-side/environment configuration. Never expose a private API secret in a client bundle. Treat the current workspace’s shared `vessel_users`/`vessels` implementation as an implementation mismatch to resolve, not as the intended product boundary.