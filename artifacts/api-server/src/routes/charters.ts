import { and, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Router, type IRouter } from "express";
import {
  charterPartiesTable,
  charterOffersTable,
  charterAgreementsTable,
  db,
  vesselNotificationsTable,
  vesselUsersTable,
  vesselsTable,
} from "@workspace/db";
import { broadcastCharterUpdate } from "../lib/charter-socket.ts";
import { canActivateCharter, validateHireDates } from "./charter-lifecycle.ts";
import { requireVesselAuth, type VesselRequest } from "./vessel-auth-middleware.ts";

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

function serializeOffer(offer: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(offer).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value,
    ]),
  );
}

function escapeHtml(value: unknown): string {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function agreementDate(value: unknown): string {
  if (!(value instanceof Date)) return "—";
  return value.toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

function agreementHtml(charter: Record<string, any>, agreementNumber: string): string {
  const rows = [
    ["Vessel", charter.vesselName],
    ["Charterer", charter.chartererName],
    ["Ship owner", charter.ownerName],
    ["Agreed amount", charter.rate ? `${charter.rate} ${charter.rateCurrency ?? ""}` : null],
    ["Rate basis", charter.rateBasis],
    ["Earliest laycan", agreementDate(charter.laycanEarliest)],
    ["Latest laycan", agreementDate(charter.laycanLatest)],
    ["Duration", charter.durationDays ? `${charter.durationDays} days` : null],
    ["Cargo / purpose", charter.cargoPurpose],
  ];
  const rowHtml = rows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(agreementNumber)}</title>
<style>
body{font-family:Arial,sans-serif;color:#102a43;max-width:820px;margin:40px auto;padding:0 28px;line-height:1.5}
h1{margin-bottom:4px} .meta{color:#52606d;margin-bottom:28px} table{border-collapse:collapse;width:100%;margin:18px 0 28px}
th,td{text-align:left;border:1px solid #d9e2ec;padding:10px} th{width:32%;background:#f0f4f8}
.terms{white-space:pre-wrap;border:1px solid #d9e2ec;padding:14px;min-height:80px}
.confirm{margin-top:28px;padding:14px;background:#e6fffa;border:1px solid #81e6d9}
small{color:#627d98}
</style></head><body>
<h1>Charter Party Agreement</h1>
<div class="meta">${escapeHtml(agreementNumber)} · Generated ${escapeHtml(agreementDate(new Date()))}</div>
<p>This agreement records the charter terms accepted by both parties through ShipHub.</p>
<table>${rowHtml}</table>
<h2>Terms and conditions</h2>
<div class="terms">${escapeHtml(charter.terms)}</div>
<div class="confirm"><strong>Mutual acceptance recorded</strong><br>
Owner confirmed: ${escapeHtml(agreementDate(charter.ownerConfirmedAt))}<br>
Charterer confirmed: ${escapeHtml(agreementDate(charter.chartererConfirmedAt))}</div>
<p><small>This document is generated from the final offer accepted by both parties. Parties should review it against any separately signed contractual documents.</small></p>
</body></html>`;
}

async function ensureAgreement(charter: Record<string, any>) {
  const [existing] = await db
    .select()
    .from(charterAgreementsTable)
    .where(eq(charterAgreementsTable.charterId, charter.id));
  if (existing) return existing;
  const agreementNumber = `CHP-${charter.id}`;
  const [created] = await db
    .insert(charterAgreementsTable)
    .values({
      charterId: charter.id,
      agreementNumber,
      content: agreementHtml(charter, agreementNumber),
    })
    .returning();
  return created;
}

async function getOfferHistory(charterId: number) {
  const rows = await db
    .select({
      id: charterOffersTable.id,
      charterId: charterOffersTable.charterId,
      actorId: charterOffersTable.actorId,
      actorRole: charterOffersTable.actorRole,
      actorName: vesselUsersTable.name,
      supersedesOfferId: charterOffersTable.supersedesOfferId,
      rate: charterOffersTable.rate,
      rateCurrency: charterOffersTable.rateCurrency,
      rateBasis: charterOffersTable.rateBasis,
      laycanEarliest: charterOffersTable.laycanEarliest,
      laycanLatest: charterOffersTable.laycanLatest,
      durationDays: charterOffersTable.durationDays,
      cargoPurpose: charterOffersTable.cargoPurpose,
      terms: charterOffersTable.terms,
      createdAt: charterOffersTable.createdAt,
    })
    .from(charterOffersTable)
    .innerJoin(vesselUsersTable, eq(charterOffersTable.actorId, vesselUsersTable.id))
    .where(eq(charterOffersTable.charterId, charterId))
    .orderBy(desc(charterOffersTable.createdAt), desc(charterOffersTable.id));
  return rows.map((row) => serializeOffer(row));
}

async function recordOffer(
  charter: Record<string, any>,
  actorId: number,
  actorRole: "owner" | "charterer",
  supersedesOfferId: number | null,
) {
  const [offer] = await db
    .insert(charterOffersTable)
    .values({
      charterId: charter.id,
      actorId,
      actorRole,
      supersedesOfferId,
      rate: charter.rate,
      rateCurrency: charter.rateCurrency ?? "USD",
      rateBasis: charter.rateBasis,
      laycanEarliest: charter.laycanEarliest,
      laycanLatest: charter.laycanLatest,
      durationDays: charter.durationDays,
      cargoPurpose: charter.cargoPurpose,
      terms: charter.terms,
    })
    .returning();
  return offer;
}

async function ensureBaselineOffer(charter: Record<string, any>) {
  const existing = await db
    .select({ id: charterOffersTable.id })
    .from(charterOffersTable)
    .where(eq(charterOffersTable.charterId, charter.id))
    .limit(1);
  if (existing.length === 0) {
    await recordOffer(charter, charter.chartererId, "charterer", null);
  }
  return getOfferHistory(charter.id);
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

  const createdCharter = await findCharter(charter.id);
  await recordOffer(createdCharter!, userId, "charterer", null);
  await notify(
    vessel.ownerId,
    "enquiry_received",
    "New charter enquiry",
    `${req.vesselAuth!.email} submitted an enquiry for ${vessel.name}.`,
    charter.id,
  );
  broadcastCharterUpdate(charter.id);
  res.status(201).json(serializeCharter(createdCharter!));
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

router.get("/charter-parties/:id/offers", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (!charter || !(await canViewCharter(req, charter))) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  res.json(await ensureBaselineOffer(charter));
});

router.get("/charter-parties/:id/agreement", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const charter = Number.isInteger(id) && id > 0 ? await findCharter(id) : undefined;
  if (!charter || !(await canViewCharter(req, charter))) {
    res.status(404).json({ error: "Charter not found" });
    return;
  }
  if (charter.status !== "confirmed" && charter.status !== "active") {
    res.status(409).json({ error: "The agreement is generated after both parties confirm" });
    return;
  }
  const agreement = await ensureAgreement(charter);
  res.json({
    id: agreement.id,
    charterId: agreement.charterId,
    agreementNumber: agreement.agreementNumber,
    content: agreement.content,
    generatedAt: agreement.generatedAt.toISOString(),
  });
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
  const isOwner = req.vesselAuth!.userId === charter.ownerId;
  const offerHistory = await ensureBaselineOffer(charter);
  const latestOffer = offerHistory[0] as Record<string, any> | undefined;
  const actorRole = isOwner ? "owner" : "charterer";
  if (latestOffer?.actorRole === actorRole) {
    res.status(409).json({
      error: `Wait for the ${isOwner ? "charterer" : "ship owner"} to respond before sending another offer`,
    });
    return;
  }
  const nextCharter = {
    ...charter,
    rate: body.rate === undefined ? charter.rate : terms.rate,
    rateCurrency: terms.rateCurrency ?? charter.rateCurrency,
    rateBasis: body.rateBasis === undefined ? charter.rateBasis : terms.rateBasis,
    laycanEarliest:
      body.laycanEarliest === undefined ? charter.laycanEarliest : terms.laycanEarliest,
    laycanLatest:
      body.laycanLatest === undefined ? charter.laycanLatest : terms.laycanLatest,
    durationDays: body.durationDays === undefined ? charter.durationDays : terms.durationDays,
    cargoPurpose:
      body.cargoPurpose === undefined ? charter.cargoPurpose : stringValue(body.cargoPurpose),
    terms: body.terms === undefined ? charter.terms : stringValue(body.terms),
  };
  await db
    .update(charterPartiesTable)
    .set({
      rate: nextCharter.rate,
      rateCurrency: nextCharter.rateCurrency,
      rateBasis: nextCharter.rateBasis,
      laycanEarliest: nextCharter.laycanEarliest,
      laycanLatest: nextCharter.laycanLatest,
      durationDays: nextCharter.durationDays,
      cargoPurpose: nextCharter.cargoPurpose,
      terms: nextCharter.terms,
      status: "negotiating",
      ownerConfirmedAt: null,
      chartererConfirmedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(charterPartiesTable.id, id));
  await recordOffer(nextCharter, req.vesselAuth!.userId, actorRole, latestOffer?.id ?? null);
  broadcastCharterUpdate(id);
  await notify(
    isOwner ? charter.chartererId : charter.ownerId,
    "terms_updated",
    isOwner ? "Owner sent revised charter terms" : "Charterer updated the enquiry",
    isOwner
      ? `The ship owner sent revised terms for ${charter.vesselName}. Review the new amount and conditions before confirming.`
      : `The charterer updated the enquiry for ${charter.vesselName}. Review the revised terms.`,
    id,
  );
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
  if (!isOwner && !charter.ownerConfirmedAt) {
    res.status(409).json({
      error: "The ship owner must confirm the enquiry before you can confirm it",
    });
    return;
  }
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

  const updatedCharter = await findCharter(id);
  if (nextStatus === "confirmed") {
    const agreement = await ensureAgreement(updatedCharter!);
    await Promise.all([
      notify(
        charter.ownerId,
        "charter_agreement_ready",
        "Charter party agreement ready",
        `Both parties accepted the terms for ${charter.vesselName}. Agreement ${agreement.agreementNumber} is ready to review.`,
        id,
      ),
      notify(
        charter.chartererId,
        "charter_agreement_ready",
        "Charter party agreement ready",
        `Both parties accepted the terms for ${charter.vesselName}. Agreement ${agreement.agreementNumber} is ready to review.`,
        id,
      ),
    ]);
  } else {
    await notify(
      isOwner ? charter.chartererId : charter.ownerId,
      "terms_updated",
      "Charter confirmation updated",
      isOwner
        ? `The ship owner confirmed the terms for ${charter.vesselName}. Review and confirm the enquiry if you accept them.`
        : `The charterer accepted the owner-confirmed terms for ${charter.vesselName}.`,
      id,
    );
  }
  res.json(serializeCharter(updatedCharter!));
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
  try {
    await db.transaction(async (tx) => {
      const [terminated] = await tx
        .update(charterPartiesTable)
        .set({ status: "terminated", updatedAt: now })
        .where(
          and(
            eq(charterPartiesTable.id, id),
            eq(charterPartiesTable.status, "active"),
          ),
        )
        .returning({ id: charterPartiesTable.id });
      if (!terminated) {
        throw new Error("Only active charters can be terminated");
      }
      await tx
        .update(vesselsTable)
        .set({ status: "available", updatedAt: now })
        .where(eq(vesselsTable.id, charter.vesselId));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to terminate charter";
    res.status(409).json({ error: message });
    return;
  }
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
    !canActivateCharter(req.vesselAuth!, charter)
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

  const dates = validateHireDates(req.body ?? {}, charter);
  if ("error" in dates) {
    res.status(400).json({ error: dates.error });
    return;
  }
  const { hireStart, hireEnd } = dates;

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