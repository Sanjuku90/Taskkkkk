import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import plansRouter from "./plans";
import tasksRouter from "./tasks";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";
import bonusesRouter from "./bonuses";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/plans", plansRouter);
router.use("/users", plansRouter);
router.use("/tasks", tasksRouter);
router.use("/transactions", transactionsRouter);
router.use("/admin", adminRouter);
router.use("/bonuses", bonusesRouter);

export default router;
