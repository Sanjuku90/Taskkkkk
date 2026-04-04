import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import plansRouter from "./plans";
import tasksRouter from "./tasks";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";
import bonusesRouter from "./bonuses";
import gamesRouter from "./games";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/plans", plansRouter);
router.use("/users", plansRouter);
router.use("/tasks", tasksRouter);
router.use("/transactions", transactionsRouter);
router.use("/admin", adminRouter);
router.use("/bonuses", bonusesRouter);
router.use("/games", gamesRouter);
router.use("/settings", settingsRouter);

export default router;
