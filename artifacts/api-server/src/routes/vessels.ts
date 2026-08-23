import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { Router, type IRouter, type Response } from "express";
import {
  db,
  charterPartiesTable,
  vesselContactsTable,
  vesselPhotosTable,
  vesselUsersTable,
  vesselsTable,
} from "@workspace/db";
import { isAdminOrOwner, requireVesselAuth, type VesselRequest } from "./vessel-auth-middleware.ts";

const router: IRouter = Router();
const VESSEL_STATUSES = ["available", "on_hire", "laid_up", "decommissioned"] as const;

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

function serializeVessel(vessel: {
  id: number;
  ownerId: number;
  name: string;
  imoNumber: string | null;
  vesselType: string;
  flag: string | null;
  dwt: string | null;
  grt: string | null;
  yearBuilt: number | null;
  loa: string | null;
  beam: string | null;
  draft: string | null;
  classificationSociety: string | null;
  tradingArea: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  ownerName?: string | null;
  firstPhotoPath?: string | null;
}) {
  return {
    ...vessel,
    createdAt: vessel.createdAt.toISOString(),
    updatedAt: vessel.updatedAt.toISOString(),
  };
}

async function findVessel(id: number) {
  const [vessel] = await db
    .select({
      id: vesselsTable.id,
      ownerId: vesselsTable.ownerId,
      name: vesselsTable.name,
      imoNumber: vesselsTable.imoNumber,
      vesselType: vesselsTable.vesselType,
      flag: vesselsTable.flag,
      dwt: vesselsTable.dwt,
      grt: vesselsTable.grt,
      yearBuilt: vesselsTable.yearBuilt,
      loa: vesselsTable.loa,
      beam: vesselsTable.beam,
      draft: vesselsTable.draft,
      classificationSociety: vesselsTable.classificationSociety,
      tradingArea: vesselsTable.tradingArea,
      description: vesselsTable.description,
      status: vesselsTable.status,
      createdAt: vesselsTable.createdAt,
      updatedAt: vesselsTable.updatedAt,
      ownerName: vesselUsersTable.name,
    })
    .from(vesselsTable)
    .leftJoin(vesselUsersTable, eq(vesselsTable.ownerId, vesselUsersTable.id))
    .where(eq(vesselsTable.id, id));
  return vessel;
}

async function hasActiveCharter(vesselId: number) {
  const [charter] = await db
    .select({ id: charterPartiesTable.id })
    .from(charterPartiesTable)
    .where(
      and(
        eq(charterPartiesTable.vesselId, vesselId),
        eq(charterPartiesTable.status, "active"),
      ),
    )
    .limit(1);
  return Boolean(charter);
}

function rejectAvailableStatusDuringActiveCharter(res: Response) {
  res.status(409).json({
    error: "This vessel has an active charter. The charter must be terminated before the vessel can be marked available.",
  });
}

router.use(requireVesselAuth);

router.get("/vessels", async (req: VesselRequest, res): Promise<void> => {
  const filters = [];
  const vesselType = stringValue(req.query.vesselType);
  const status = stringValue(req.query.status);
  const tradingArea = stringValue(req.query.tradingArea);
  const search = stringValue(req.query.search);

  if (vesselType) filters.push(eq(vesselsTable.vesselType, vesselType));
  if (status) {
    if (!VESSEL_STATUSES.includes(status as (typeof VESSEL_STATUSES)[number])) {
      res.status(400).json({ error: "Invalid vessel status" });
      return;
    }
    filters.push(eq(vesselsTable.status, status));
  }
  if (tradingArea) filters.push(ilike(vesselsTable.tradingArea, `%${tradingArea}%`));
  if (search) {
    filters.push(
      sql`(${ilike(vesselsTable.name, `%${search}%`)} OR ${ilike(
        vesselsTable.imoNumber,
        `%${search}%`,
      )})`,
    );
  }

  const rows = await db
    .select({
      id: vesselsTable.id,
      ownerId: vesselsTable.ownerId,
      name: vesselsTable.name,
      imoNumber: vesselsTable.imoNumber,
      vesselType: vesselsTable.vesselType,
      flag: vesselsTable.flag,
      dwt: vesselsTable.dwt,
      grt: vesselsTable.grt,
      yearBuilt: vesselsTable.yearBuilt,
      loa: vesselsTable.loa,
      beam: vesselsTable.beam,
      draft: vesselsTable.draft,
      classificationSociety: vesselsTable.classificationSociety,
      tradingArea: vesselsTable.tradingArea,
      description: vesselsTable.description,
      status: vesselsTable.status,
      createdAt: vesselsTable.createdAt,
      updatedAt: vesselsTable.updatedAt,
      ownerName: vesselUsersTable.name,
      firstPhotoPath: sql<string | null>`(
        SELECT ${vesselPhotosTable.objectPath}
        FROM ${vesselPhotosTable}
        WHERE ${vesselPhotosTable.vesselId} = ${vesselsTable.id}
        ORDER BY ${vesselPhotosTable.sortOrder}, ${vesselPhotosTable.id}
        LIMIT 1
      )`,
    })
    .from(vesselsTable)
    .leftJoin(vesselUsersTable, eq(vesselsTable.ownerId, vesselUsersTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(vesselsTable.updatedAt));

  res.json(rows.map(serializeVessel));
});

router.get("/vessels/:id", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid vessel id" });
    return;
  }

  const vessel = await findVessel(id);
  if (!vessel) {
    res.status(404).json({ error: "Vessel not found" });
    return;
  }

  const [contacts, photos] = await Promise.all([
    db
      .select()
      .from(vesselContactsTable)
      .where(eq(vesselContactsTable.vesselId, id))
      .orderBy(vesselContactsTable.id),
    db
      .select()
      .from(vesselPhotosTable)
      .where(eq(vesselPhotosTable.vesselId, id))
      .orderBy(vesselPhotosTable.sortOrder, vesselPhotosTable.id),
  ]);

  res.json({
    ...serializeVessel(vessel),
    contacts,
    photos: photos.map((photo) => ({
      ...photo,
      uploadedAt: photo.uploadedAt.toISOString(),
    })),
  });
});

router.post("/vessels", async (req: VesselRequest, res): Promise<void> => {
  if (!isAdminOrOwner(req)) {
    res.status(403).json({ error: "Only vessel owners can create listings" });
    return;
  }

  const body = req.body ?? {};
  const name = stringValue(body.name);
  const vesselType = stringValue(body.vesselType);
  const yearBuilt = integerValue(body.yearBuilt);
  if (!name || !vesselType) {
    res.status(400).json({ error: "name and vesselType are required" });
    return;
  }
  if (body.yearBuilt && yearBuilt === null) {
    res.status(400).json({ error: "yearBuilt must be a whole number" });
    return;
  }

  const [vessel] = await db
    .insert(vesselsTable)
    .values({
      ownerId: req.vesselAuth!.userId,
      name,
      vesselType,
      imoNumber: stringValue(body.imoNumber),
      flag: stringValue(body.flag),
      dwt: stringValue(body.dwt),
      grt: stringValue(body.grt),
      yearBuilt,
      loa: stringValue(body.loa),
      beam: stringValue(body.beam),
      draft: stringValue(body.draft),
      classificationSociety: stringValue(body.classificationSociety),
      tradingArea: stringValue(body.tradingArea),
      description: stringValue(body.description),
      status: VESSEL_STATUSES.includes(body.status) ? body.status : "available",
    })
    .returning();

  res.status(201).json(serializeVessel({ ...vessel, ownerName: null, firstPhotoPath: null }));
});

router.put("/vessels/:id", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const existing = Number.isInteger(id) && id > 0 ? await findVessel(id) : undefined;
  if (!existing) {
    res.status(404).json({ error: "Vessel not found" });
    return;
  }
  if (!isAdminOrOwner(req) || (req.vesselAuth!.role !== "admin" && existing.ownerId !== req.vesselAuth!.userId)) {
    res.status(403).json({ error: "You cannot edit this vessel" });
    return;
  }

  const body = req.body ?? {};
  const name = stringValue(body.name);
  const vesselType = stringValue(body.vesselType);
  if (!name || !vesselType) {
    res.status(400).json({ error: "name and vesselType are required" });
    return;
  }
  const yearBuilt = integerValue(body.yearBuilt);
  if (body.yearBuilt && yearBuilt === null) {
    res.status(400).json({ error: "yearBuilt must be a whole number" });
    return;
  }
  const requestedStatus = VESSEL_STATUSES.includes(body.status) ? body.status : existing.status;
  if (requestedStatus === "available" && await hasActiveCharter(id)) {
    rejectAvailableStatusDuringActiveCharter(res);
    return;
  }

  await db
    .update(vesselsTable)
    .set({
      name,
      vesselType,
      imoNumber: stringValue(body.imoNumber),
      flag: stringValue(body.flag),
      dwt: stringValue(body.dwt),
      grt: stringValue(body.grt),
      yearBuilt,
      loa: stringValue(body.loa),
      beam: stringValue(body.beam),
      draft: stringValue(body.draft),
      classificationSociety: stringValue(body.classificationSociety),
      tradingArea: stringValue(body.tradingArea),
      description: stringValue(body.description),
      status: requestedStatus,
      updatedAt: new Date(),
    })
    .where(eq(vesselsTable.id, id));

  res.json(serializeVessel({ ...(await findVessel(id))!, firstPhotoPath: null }));
});

router.patch("/vessels/:id/status", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const existing = Number.isInteger(id) && id > 0 ? await findVessel(id) : undefined;
  const status = stringValue(req.body?.status);
  if (!existing) {
    res.status(404).json({ error: "Vessel not found" });
    return;
  }
  if (
    typeof status !== "string" ||
    !VESSEL_STATUSES.includes(status as (typeof VESSEL_STATUSES)[number])
  ) {
    res.status(400).json({ error: "Invalid vessel status" });
    return;
  }
  if (!isAdminOrOwner(req) || (req.vesselAuth!.role !== "admin" && existing.ownerId !== req.vesselAuth!.userId)) {
    res.status(403).json({ error: "You cannot edit this vessel" });
    return;
  }

  if (status === "available" && await hasActiveCharter(id)) {
    rejectAvailableStatusDuringActiveCharter(res);
    return;
  }

  await db.update(vesselsTable).set({ status, updatedAt: new Date() }).where(eq(vesselsTable.id, id));
  res.json(serializeVessel({ ...(await findVessel(id))!, firstPhotoPath: null }));
});

router.get("/vessels/:id/photos", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid vessel id" });
    return;
  }
  const photos = await db
    .select()
    .from(vesselPhotosTable)
    .where(eq(vesselPhotosTable.vesselId, id))
    .orderBy(vesselPhotosTable.sortOrder, vesselPhotosTable.id);
  res.json(photos.map((photo) => ({ ...photo, uploadedAt: photo.uploadedAt.toISOString() })));
});

router.patch("/vessels/:id/photos/reorder", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const vessel = Number.isInteger(id) && id > 0 ? await findVessel(id) : undefined;
  if (!vessel) {
    res.status(404).json({ error: "Vessel not found" });
    return;
  }
  if (!isAdminOrOwner(req) || (req.vesselAuth!.role !== "admin" && vessel.ownerId !== req.vesselAuth!.userId)) {
    res.status(403).json({ error: "You cannot edit this vessel" });
    return;
  }
  const photoIds: number[] = Array.isArray(req.body?.photoIds)
    ? req.body.photoIds.filter((photoId: unknown): photoId is number => Number.isInteger(photoId))
    : [];
  const photos = await db.select().from(vesselPhotosTable).where(eq(vesselPhotosTable.vesselId, id));
  if (photoIds.length !== photos.length || photos.some((photo) => !photoIds.includes(photo.id))) {
    res.status(400).json({ error: "photoIds must include every photo for this vessel" });
    return;
  }
  await Promise.all(
    photoIds.map((photoId, sortOrder) =>
      db
        .update(vesselPhotosTable)
        .set({ sortOrder })
        .where(eq(vesselPhotosTable.id, photoId)),
    ),
  );
  res.json(
    (await db
      .select()
      .from(vesselPhotosTable)
      .where(eq(vesselPhotosTable.vesselId, id))
      .orderBy(vesselPhotosTable.sortOrder, vesselPhotosTable.id))
      .map((photo) => ({ ...photo, uploadedAt: photo.uploadedAt.toISOString() })),
  );
});

router.delete("/vessels/:id/photos/:photoId", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  const photoId = Number(req.params.photoId);
  const vessel = Number.isInteger(id) && id > 0 ? await findVessel(id) : undefined;
  if (!vessel) {
    res.status(404).json({ error: "Vessel not found" });
    return;
  }
  if (!isAdminOrOwner(req) || (req.vesselAuth!.role !== "admin" && vessel.ownerId !== req.vesselAuth!.userId)) {
    res.status(403).json({ error: "You cannot edit this vessel" });
    return;
  }
  await db
    .delete(vesselPhotosTable)
    .where(and(eq(vesselPhotosTable.id, photoId), eq(vesselPhotosTable.vesselId, id)));
  res.status(204).send();
});

export default router;