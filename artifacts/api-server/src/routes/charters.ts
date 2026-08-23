import { and, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Router, type IRouter } from "express";
import {
  charterPartiesTable,
  db,
  vesselNotificationsTable,
  vesselUsersTable,
  vesselsTable,
} from "@workspace/db";
import { broadcastCharterUpdate } from "../lib/charter-socket";
import { requireVesselAuth, type VesselRequest } from "./vessel-auth-middleware";

const router: IRouter = Router();
const ACTIVE_STATUSES = ["enquiry", "negotiating"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "NGN"] as const;
const RATE_BASES = ["Per Day", "Per Month", "Lump Sum", "Per Metric Ton"] as const;
const ownerUsersTable = alias(vesselUsersTable, "charter_owner");

function stringValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function integerValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function dateValue(value: unknown): Date | null {
  const text = stringValue(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

const charterColumns = {
  id: charterPartiesTable.id,
  vesselId: charterPartiesTable.vesselId,
  chartererId: charterPartiesTable.chartererId,
  ownerId: charterPartiesTable.ownerId,
  rate: charterPartiesTable.rate,
  rateCurrency: charterPartiesTable.rateCurrency,
  rateBasis: charterPartiesTable.rateBasis,
  laycanEarliest: charterPartiesTable.laycanEarliest,
  laycanLatest: charterPartiesTable.laycanLatest,
  durationDays: charterPartiesTable.durationDays,
  cargoPurpose: charterPartiesTable.cargoPurpose,
  terms: charterPartiesTable.terms,
  status: charterPartiesTable.status,
  ownerConfirmedAt: charterPartiesTable.ownerConfirmedAt,
  chartererConfirmedAt: charterPartiesTable.chartererConfirmedAt,
  hireStart: charterPartiesTable.hireStart,
  hireEnd: charterPartiesTable.hireEnd,
  createdAt: charterPartiesTable.createdAt,
  updatedAt: charterPartiesTable.updatedAt,
  vesselName: vesselsTable.name,
  chartererName: vesselUsersTable.name,
};

function serializeCharter(charter: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(charter).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value,
    ]),
  );
}

async function findCharter(id: number) {
  const [charter] = await db
    .select({
      ...charterColumns,
      ownerName: vesselUsersTable.name,
    })
    .from(charterPartiesTable)
    .innerJoin(vesselsTable, eq(charterPartiesTable.vesselId, vesselsTable.id))
    .innerJoin(
      vesselUsersTable,
      eq(charterPartiesTable.chartererId, vesselUsersTable.id),
    )
    .where(eq(charterPartiesTable.id, id));

  if (!charter) return undefined;

  const [owner] = await db
    .select({ name: vesselUsersTable.name })
    .from(vesselUsersTable)
    .where(eq(vesselUsersTable.id, charter.ownerId));
  return { ...charter, ownerName: owner?.name ?? null };
}

async function canViewCharter(req: VesselRequest, charter: { chartererId: number; ownerId: number }) {
  return (
    req.vesselAuth?.role === "admin" ||
    req.vesselAuth?.userId === charter.chartererId ||
    req.vesselAuth?.userId === charter.ownerId
  );
}

function canActOnCharter(req: VesselRequest, charter: { chartererId: number; ownerId: number }) {
  return (
    req.vesselAuth?.userId === charter.chartererId ||
    req.vesselAuth?.userId === charter.ownerId
  );
}

function validateTerms(body: Record<string, unknown>) {
  const rate = stringValue(body.rate);
  const durationDays = integerValue(body.durationDays);
  const laycanEarliest = dateValue(body.laycanEarliest);
  const laycanLatest = dateValue(body.laycanLatest);
  const rateCurrency = stringValue(body.rateCurrency);
  const rateBasis = stringValue(body.rateBasis);

  if (rate && (!Number.isFinite(Number(rate)) || Number(rate) <= 0)) {
    return { error: "rate must be a positive number" } as const;
  }
  if (body.durationDays && (durationDays === null || durationDays <= 0)) {
    return { error: "durationDays must be a positive whole number" } as const;
  }
  if (body.laycanEarliest && !laycanEarliest || body.laycanLatest && !laycanLatest) {
    return { error: "Laycan dates must be valid dates" } as const;
  }
  if (laycanEarliest && laycanLatest && laycanEarliest > laycanLatest) {
    return { error: "laycanEarliest must be on or before laycanLatest" } as const;
  }
  if (rateCurrency && !CURRENCIES.includes(rateCurrency as (typeof CURRENCIES)[number])) {
    return { error: "Invalid rate currency" } as const;
  }
  if (rateBasis && !RATE_BASES.includes(rateBasis as (typeof RATE_BASES)[number])) {
    return { error: "Invalid rate basis" } as const;
  }

  return {
    rate,
    durationDays,
    laycanEarliest,
    laycanLatest,
    rateCurrency,
    rateBasis,
  } as const;
}

async function notify(
  userId: number,
  type: string,
  title: string,
  message: string,
  relatedId: number,
) {
  await db.insert(vesselNotificationsTable).values({
    userId,
    type,
    title,
    message,
    relatedId,
  });
}

router.use(requireVesselAuth);

router.post("/vessels/:vesselId/charter", async (req: VesselRequest, res): Promise<void> => {
  const vesselId = Number(req.params.vesselId);
  const userId = req.vesselAuth!.userId;
  if (!Number.isInteger(vesselId) || vesselId <= 0) {
    res.status(400).json({ error: "Invalid vessel id" });
    return;
  }
  if (!["client", "broker"].includes(req.vesselAuth!.role)) {
    res.status(403).json({ error: "Only charterers can submit enquiries" });
    return;
  }

  const [vessel] = await db
    .select()
    .from(vesselsTable)
    .where(eq(vesselsTable.id, vesselId));
  if (!vessel) {
    res.status(404).json({ error: "Vessel not found" });
    return;
  }
  if (vessel.status !== "available") {
    res.status(409).json({ error: "This vessel is not currently available" });
    return;
  }
  if (vessel.ownerId === userId) {
    res.status(403).json({ error: "Owners cannot charter their own vessel" });
    return;
  }

  const body = req.body ?? {};
  const terms = validateTerms(body);
  if ("error" in terms) {
    res.status(400).json({ error: terms.error });
    return;
  }

  const [charter] = await db
    .insert(charterPartiesTable)
    .values({
      vesselId,
      chartererId: userId,
      ownerId: vessel.ownerId,
      rate: terms.rate,
      rateCurrency: terms.rateCurrency ?? "USD",
      rateBasis: terms.rateBasis,
      laycanEarliest: terms.laycanEarliest,
      laycanLatest: terms.laycanLatest,
      durationDays: terms.durationDays,
      cargoPurpose: stringValue(body.cargoPurpose),
      terms: stringValue(body.terms),
    })
    .returning({ id: charterPartiesTable.id });

  await notify(
    vessel.ownerId,
    "enquiry_received",
    "New charter enquiry",
    `${req.vesselAuth!.email} submitted an enquiry for ${vessel.name}.`,
    charter.id,
  );
  broadcastCharterUpdate(charter.id);
  const created = await findCharter(charter.id);
  res.status(201).json(serializeCharter(created!));
});

router.get("/charter-parties", async (req: VesselRequest, res): Promise<void> => {
  const userId = req.vesselAuth!.userId;
  const isAdmin = req.vesselAuth!.role === "admin";
  const rows = await db
    .select({
      ...charterColumns,
      ownerName: ownerUsersTable.name,
    })
    .from(charterPartiesTable)
    .innerJoin(vesselsTable, eq(charterPartiesTable.vesselId, vesselsTable.id))
    .innerJoin(
      vesselUsersTable,
      eq(charterPartiesTable.chartererId, vesselUsersTable.id),
    )
    .innerJoin(
      ownerUsersTable,
      eq(charterPartiesTable.ownerId, ownerUsersTable.id),
    )
    .where(
      isAdmin
        ? undefined
        : or(
            eq(charterPartiesTable.chartererId, userId),
            eq(charterPartiesTable.ownerId, userId),
          ),
    )
    .orderBy(desc(charterPartiesTable.updatedAt));

  res.json(
    rows.map((row) => serializeCharter(row)),
  );
});

router.get("/charter-parties/:id", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid charter id" });
    return;
  }
  const charter = await findCharter(id);
  if (!charter || !(await canViewCharter(req, charter))) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  res.json(serializeCharter(charter));
});

router.put("/charter-parties/:id", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (!charter || !canActOnCharter(req, charter)) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  if (!ACTIVE_STATUSES.includes(charter.status as (typeof ACTIVE_STATUSES)[number])) {
    res.status(409).json({ error: "Only open enquiries can be edited" });
    return;
  }
  const body = req.body ?? {};
  const terms = validateTerms(body);
  if ("error" in terms) {
    res.status(400).json({ error: terms.error });
    return;
  }
  await db
    .update(charterPartiesTable)
    .set({
      rate: terms.rate,
      rateCurrency: terms.rateCurrency ?? charter.rateCurrency,
      rateBasis: terms.rateBasis,
      laycanEarliest: terms.laycanEarliest,
      laycanLatest: terms.laycanLatest,
      durationDays: terms.durationDays,
      cargoPurpose: stringValue(body.cargoPurpose),
      terms: stringValue(body.terms),
      status: "negotiating",
      ownerConfirmedAt: null,
      chartererConfirmedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(charterPartiesTable.id, id));
  broadcastCharterUpdate(id);
  res.json(serializeCharter((await findCharter(id))!));
});

router.post("/charter-parties/:id/confirm", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (!charter || !canActOnCharter(req, charter)) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  if (!ACTIVE_STATUSES.includes(charter.status as (typeof ACTIVE_STATUSES)[number])) {
    res.status(409).json({ error: "This charter cannot be confirmed" });
    return;
  }

  const now = new Date();
  const isOwner = req.vesselAuth!.userId === charter.ownerId;
  const nextOwnerConfirmedAt = isOwner ? now : charter.ownerConfirmedAt;
  const nextChartererConfirmedAt = isOwner ? charter.chartererConfirmedAt : now;
  const nextStatus = nextOwnerConfirmedAt && nextChartererConfirmedAt ? "confirmed" : "negotiating";
  await db
    .update(charterPartiesTable)
    .set({
      ownerConfirmedAt: nextOwnerConfirmedAt,
      chartererConfirmedAt: nextChartererConfirmedAt,
      status: nextStatus,
      updatedAt: now,
    })
    .where(eq(charterPartiesTable.id, id));
  broadcastCharterUpdate(id);

  await notify(
    isOwner ? charter.chartererId : charter.ownerId,
    "terms_updated",
    "Charter confirmation updated",
    `${isOwner ? "The owner" : "The charterer"} confirmed the terms for ${charter.vesselName}.`,
    id,
  );
  res.json(serializeCharter((await findCharter(id))!));
});

router.post("/charter-parties/:id/decline", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (!charter || !canActOnCharter(req, charter)) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  if (!ACTIVE_STATUSES.includes(charter.status as (typeof ACTIVE_STATUSES)[number])) {
    res.status(409).json({ error: "This charter cannot be declined" });
    return;
  }
  await db
    .update(charterPartiesTable)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(charterPartiesTable.id, id));
  broadcastCharterUpdate(id);
  await notify(
    req.vesselAuth!.userId === charter.ownerId ? charter.chartererId : charter.ownerId,
    "charter_declined",
    "Charter enquiry declined",
    `${charter.vesselName} charter enquiry was declined.`,
    id,
  );
  res.json(serializeCharter((await findCharter(id))!));
});

router.post("/charter-parties/:id/terminate", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (!charter || req.vesselAuth!.role !== "admin" && req.vesselAuth!.userId !== charter.ownerId) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  if (charter.status !== "active") {
    res.status(409).json({ error: "Only active charters can be terminated" });
    return;
  }
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(charterPartiesTable)
      .set({ status: "terminated", updatedAt: now })
      .where(eq(charterPartiesTable.id, id));
    await tx
      .update(vesselsTable)
      .set({ status: "available", updatedAt: now })
      .where(eq(vesselsTable.id, charter.vesselId));
  });
  broadcastCharterUpdate(id);
  await notify(
    charter.chartererId,
    "charter_terminated",
    "Charter terminated",
    `${charter.vesselName} charter was terminated by the owner.`,
    id,
  );
  res.json(serializeCharter((await findCharter(id))!));
});

router.post("/charter-parties/:id/activate", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (
    !charter ||
    req.vesselAuth!.role !== "admin" &&
      req.vesselAuth!.userId !== charter.ownerId
  ) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  if (charter.status !== "confirmed") {
    res.status(409).json({ error: "Only confirmed charters can be activated" });
    return;
  }
  if (!charter.durationDays || charter.durationDays <= 0) {
    res.status(409).json({ error: "A positive charter duration is required before activation" });
    return;
  }

  const requestedStart = dateValue(req.body?.hireStart);
  const requestedEnd = dateValue(req.body?.hireEnd);
  if (req.body?.hireStart && !requestedStart || req.body?.hireEnd && !requestedEnd) {
    res.status(400).json({ error: "Hire dates must be valid dates" });
    return;
  }

  const hireStart = requestedStart ?? charter.laycanEarliest ?? new Date();
  const hireEnd = requestedEnd ?? new Date(hireStart.getTime() + charter.durationDays * 24 * 60 * 60 * 1000);
  if (hireEnd <= hireStart) {
    res.status(400).json({ error: "hireEnd must be after hireStart" });
    return;
  }

  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      const [vessel] = await tx
        .select({ status: vesselsTable.status })
        .from(vesselsTable)
        .where(eq(vesselsTable.id, charter.vesselId));
      if (!vessel) {
        throw new Error("Vessel not found");
      }
      if (vessel.status !== "available") {
        throw new Error("This vessel is not currently available");
      }

      const [claimedVessel] = await tx
        .update(vesselsTable)
        .set({ status: "on_hire", updatedAt: now })
        .where(
          and(
            eq(vesselsTable.id, charter.vesselId),
            eq(vesselsTable.status, "available"),
          ),
        )
        .returning({ id: vesselsTable.id });
      if (!claimedVessel) {
        throw new Error("This vessel is not currently available");
      }

      await tx
        .update(charterPartiesTable)
        .set({ status: "active", hireStart, hireEnd, updatedAt: now })
        .where(eq(charterPartiesTable.id, id));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate charter";
    res.status(message === "Vessel not found" ? 404 : 409).json({ error: message });
    return;
  }

  broadcastCharterUpdate(id);
  await notify(
    charter.chartererId,
    "charter_active",
    "Charter hire started",
    `${charter.vesselName} is now on hire from ${hireStart.toISOString().slice(0, 10)} to ${hireEnd.toISOString().slice(0, 10)}.`,
    id,
  );
  res.json(serializeCharter((await findCharter(id))!));
});

export default router;