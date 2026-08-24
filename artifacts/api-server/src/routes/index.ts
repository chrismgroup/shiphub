import { Router, type IRouter } from "express";
import healthRouter from "./health.ts";
import vesselAuthRouter from "./vessel-auth.ts";
import vesselsRouter from "./vessels.ts";
import chartersRouter from "./charters.ts";
import notificationsRouter from "./notifications.ts";
import ownersApiProxyRouter from "./owners-api-proxy.ts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ownersApiProxyRouter);
router.use(vesselAuthRouter);
router.use(vesselsRouter);
router.use(chartersRouter);
router.use(notificationsRouter);
export default router;
