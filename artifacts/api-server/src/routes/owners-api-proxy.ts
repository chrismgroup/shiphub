import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();
const OWNER_API_PATHS = [
  "/vessels",
  "/charter-parties",
  "/vessel-notifications",
  "/vessel-admin",
  "/vessel-photos",
] as const;

function isLocalFixtureMode(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.SHIPHUB_LOCAL_FIXTURE_MODE === "true"
  );
}

function ownersApiBaseUrl(): string | null {
  const value = process.env.SHIPHUB_OWNERS_API_BASE_URL?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}

function isOwnersApiPath(path: string): boolean {
  return OWNER_API_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function responseBody(req: Request): string | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (req.body === undefined || req.body === null) return undefined;
  return JSON.stringify(req.body);
}

function forwardResponseHeaders(upstream: globalThis.Response, res: Response): void {
  const contentType = upstream.headers.get("content-type");
  const cacheControl = upstream.headers.get("cache-control");
  if (contentType) res.setHeader("content-type", contentType);
  if (cacheControl) res.setHeader("cache-control", cacheControl);
}

router.use(async (req: Request, res: Response, next): Promise<void> => {
  // Browser tests can explicitly use the project database for disposable,
  // fully-cleaned fixture data. Production must always retain the Owners API
  // boundary, regardless of this environment variable.
  if (isLocalFixtureMode()) {
    next();
    return;
  }

  if (!isOwnersApiPath(req.path)) {
    next();
    return;
  }

  const baseUrl = ownersApiBaseUrl();
  const serviceKey = process.env.SHIPHUB_OWNERS_API_KEY?.trim();
  if (!baseUrl || !serviceKey) {
    res.status(503).json({
      error: "The ShipHub Owners API connection is not configured.",
    });
    return;
  }

  const authorization = req.header("authorization");
  const headers = new Headers();
  const contentType = req.header("content-type");
  if (contentType) headers.set("content-type", contentType);

  // User sessions take precedence for protected endpoints. The service key
  // keeps catalogue requests server-authenticated without entering the app bundle.
  headers.set("authorization", authorization ?? `Bearer ${serviceKey}`);
  headers.set("accept", req.header("accept") ?? "application/json");

  try {
    const requestPath = req.originalUrl.replace(/^\/api/, "");
    const upstream = await fetch(`${baseUrl}${requestPath}`, {
      method: req.method,
      headers,
      body: responseBody(req),
    });

    forwardResponseHeaders(upstream, res);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(body);
  } catch {
    res.status(502).json({
      error: "Unable to reach the ShipHub Owners API.",
    });
  }
});

export default router;