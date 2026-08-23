import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type VesselAuth = {
  userId: number;
  email: string;
  role: string;
};

export type VesselRequest = Request & {
  vesselAuth?: VesselAuth;
};

type TokenPayload = VesselAuth & {
  scope: "vessel";
  iat: number;
  exp: number;
};

function getTokenSecret(): string | null {
  return process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? null;
}

function decodePart<T>(part: string): T | null {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function authenticateVesselToken(token: string | undefined): VesselAuth | null {
  const secret = getTokenSecret();
  if (!secret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const signedContent = `${parts[0]}.${parts[1]}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedContent)
    .digest();
  const actualSignature = Buffer.from(parts[2], "base64url");
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  const payload = decodePart<TokenPayload>(parts[1]);
  if (
    !payload ||
    payload.scope !== "vessel" ||
    !Number.isInteger(payload.userId) ||
    !payload.email ||
    !payload.role ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

export function requireVesselAuth(
  req: VesselRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
  const auth = authenticateVesselToken(token);

  if (!auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  req.vesselAuth = auth;
  next();
}

export function isAdminOrOwner(req: VesselRequest): boolean {
  return req.vesselAuth?.role === "admin" || req.vesselAuth?.role === "owner";
}