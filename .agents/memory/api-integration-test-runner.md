---
name: API integration test runner
description: Native Node test execution needs a bundled CommonJS harness for this monorepo's extensionless workspace imports and Express dependencies.
---

Use an esbuild-generated CommonJS test bundle for API integration tests that import the Express app; run it with production logging and remove the temporary bundle afterward.

**Why:** Native Node TypeScript execution does not resolve the workspace's extensionless generated imports, while bundling the ESM app directly can trigger unsupported dynamic CommonJS requires.

**How to apply:** Keep production source ESM and use the API package's test-only build harness when tests need HTTP routes and the real database.