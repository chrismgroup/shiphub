import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vesselAuthRouter from "./vessel-auth";
import vesselsRouter from "./vessels";
import chartersRouter from "./charters";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vesselAuthRouter);
router.use(vesselsRouter);
router.use(chartersRouter);
router.use(notificationsRouter);
export default router;
