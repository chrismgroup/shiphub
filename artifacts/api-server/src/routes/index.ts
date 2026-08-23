import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vesselAuthRouter from "./vessel-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vesselAuthRouter);

export default router;
