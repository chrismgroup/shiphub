# ShipHub Charterer

ShipHub Charterer is an Expo mobile app backed by an Express API for vessel discovery and charter workflows.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (set `PORT`, commonly 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required API env: `DATABASE_URL`, plus `SESSION_SECRET` or `JWT_SECRET` for authentication.
- Production owner integration env: `SHIPHUB_OWNERS_API_BASE_URL` and `SHIPHUB_OWNERS_API_KEY`.

## Render deployment

The root `render.yaml` defines the production API web service and a managed Postgres database. In Render, create a Blueprint from the repository and provide the secret values prompted by the Blueprint:

- `SESSION_SECRET` or `JWT_SECRET` — use a long random value; do not commit it.
- `SHIPHUB_OWNERS_API_BASE_URL` — the upstream Owners API URL.
- `SHIPHUB_OWNERS_API_KEY` — the upstream service key.

Render supplies `PORT` and `DATABASE_URL`. The API health check is `/api/healthz`. Run the database schema push once against the Render database with `pnpm --filter @workspace/db run push` if the database is new.

The Expo app is not deployed as a Render web service. Build it with EAS and set `EXPO_PUBLIC_API_URL` to the full API base URL, including `/api`, for example `https://shiphub-api.onrender.com/api`. Set `EXPO_PUBLIC_OWNERS_API_BASE_URL` only when the mobile app should connect directly to that upstream WebSocket/API boundary.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- `render.yaml` — Render Blueprint for the API and database
- `artifacts/api-server/src/routes/health.ts` — health check implementation
- `artifacts/vessel-marketplace/lib/api.ts` — mobile API base URL configuration
