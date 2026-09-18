# ShipHub Charterer

ShipHub Charterer is an Expo mobile app backed by an Express API for vessel discovery and charter workflows.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server with `PORT` set
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck and build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push database schema changes

Required API environment variables:

- `DATABASE_URL`
- `SESSION_SECRET` or `JWT_SECRET`
- `SHIPHUB_OWNERS_API_BASE_URL`
- `SHIPHUB_OWNERS_API_KEY`

## Render Deployment

The root `render.yaml` defines two Render web services and a managed PostgreSQL database:

- `shiphub-api`: Express API at `https://shiphub-api.onrender.com`
- `shiphub-marketplace`: static Expo bundle served by Node
- `shiphub-db`: managed PostgreSQL database

Create a Render Blueprint from this repository and provide the secret values prompted by the Blueprint. Render supplies `PORT` and `DATABASE_URL`. The API health check is `/api/healthz`.

For EAS builds, set `EXPO_PUBLIC_API_URL` to `https://shiphub-api.onrender.com/api`. The app uses that same URL as its production fallback when no build-time value is supplied.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod and `drizzle-zod`
- API codegen: Orval from the OpenAPI spec
- Build: esbuild and Expo Metro

## Pointers

- `render.yaml` — Render Blueprint for services and database
- `artifacts/api-server/src/routes/health.ts` — API health check
- `artifacts/vessel-marketplace/lib/api.ts` — mobile API URL configuration
