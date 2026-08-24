---
name: Owners session expiry
description: How the Charterer app must handle expired sessions issued by the external Owners API.
---

When a protected Owners API request returns 401, clear the persisted Charterer session and direct the user to sign in again before they retry the action.

**Why:** The server-side Owners API key can still load the public vessel catalogue while an individual user's Owners-issued token has expired. Without explicit recovery, the user appears signed in but cannot submit or manage charter enquiries.

**How to apply:** Keep recovery at the shared API client/auth-context boundary so every protected feature, not just charter submission, responds consistently to an invalid or expired session.