import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, vesselNotificationsTable } from "@workspace/db";
import { requireVesselAuth, type VesselRequest } from "./vessel-auth-middleware";

const router: IRouter = Router();

function serializeNotification(notification: typeof vesselNotificationsTable.$inferSelect) {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  };
}

router.use(requireVesselAuth);

router.get("/vessel-notifications", async (req: VesselRequest, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(vesselNotificationsTable)
    .where(eq(vesselNotificationsTable.userId, req.vesselAuth!.userId))
    .orderBy(desc(vesselNotificationsTable.createdAt));
  res.json(notifications.map(serializeNotification));
});

router.patch("/vessel-notifications/:id/read", async (req: VesselRequest, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid notification id" });
    return;
  }
  const [notification] = await db
    .update(vesselNotificationsTable)
    .set({ read: true })
    .where(
      and(
        eq(vesselNotificationsTable.id, id),
        eq(vesselNotificationsTable.userId, req.vesselAuth!.userId),
      ),
    )
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(serializeNotification(notification));
});

router.post("/vessel-notifications/read-all", async (req: VesselRequest, res): Promise<void> => {
  await db
    .update(vesselNotificationsTable)
    .set({ read: true })
    .where(
      and(
        eq(vesselNotificationsTable.userId, req.vesselAuth!.userId),
        eq(vesselNotificationsTable.read, false),
      ),
    );
  res.json({ ok: true });
});

export default router;