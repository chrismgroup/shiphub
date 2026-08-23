import { createHmac, randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vesselUsersTable } from "@workspace/db";

const router: IRouter = Router();
const scrypt = promisify(nodeScrypt);
const TOKEN_TTL_SECONDS = 24 * 60 * 60;

type TokenPayload = {
  userId: number;
  email: string;
  role: string;
  scope: "vessel";
  iat: number;
  exp: number;
};

function getTokenSecret(): string | null {
  return process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? null;
}

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function signToken(user: typeof vesselUsersTable.$inferSelect): string {
  const secret = getTokenSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      scope: "vessel",
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    } satisfies TokenPayload),
  );
  const content = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(content).digest();
  return `${content}.${encodeBase64Url(signature)}`;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const actualHex = derivedKey.toString("hex");
  return actualHex === expectedHex;
}

function safeUser(user: typeof vesselUsersTable.$inferSelect) {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

function normalizedEmail(value: unknown): string {
  return String(value).trim().toLowerCase();
}

router.post("/vessels/auth/register", async (req, res): Promise<void> => {
  if (!getTokenSecret()) {
    res.status(503).json({ error: "Authentication is not configured" });
    return;
  }

  const { name, email, password, role, company, phone } = req.body ?? {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmailValue = normalizedEmail(email);

  if (!normalizedName || !normalizedEmailValue || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const resolvedRole = ["client", "broker", "owner"].includes(role)
    ? role
    : "client";

  try {
    const [existing] = await db
      .select({ id: vesselUsersTable.id })
      .from(vesselUsersTable)
      .where(eq(vesselUsersTable.email, normalizedEmailValue));
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const [user] = await db
      .insert(vesselUsersTable)
      .values({
        name: normalizedName,
        email: normalizedEmailValue,
        password: await hashPassword(String(password)),
        role: resolvedRole,
        company: typeof company === "string" && company.trim() ? company.trim() : null,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      })
      .returning();

    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "23505") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    throw error;
  }
});

router.post("/vessels/auth/login", async (req, res): Promise<void> => {
  if (!getTokenSecret()) {
    res.status(503).json({ error: "Authentication is not configured" });
    return;
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(vesselUsersTable)
    .where(eq(vesselUsersTable.email, normalizedEmail(email)));

  if (!user || !(await verifyPassword(String(password), user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json({ token: signToken(user), user: safeUser(user) });
});

export default router;