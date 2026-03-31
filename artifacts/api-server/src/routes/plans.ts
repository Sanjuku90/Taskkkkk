import { Router } from "express";
import { db, plansTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ActivatePlanBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.id);
  res.json(plans.map(p => ({
    id: p.id,
    name: p.name,
    depositRequired: Number(p.depositRequired),
    tasksPerDay: p.tasksPerDay,
    gainPerTask: Number(p.gainPerTask),
    totalPerDay: Number(p.totalPerDay),
  })));
});

router.post("/plan", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = ActivatePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, parsed.data.planId)).limit(1);
  if (!plan) {
    res.status(400).json({ error: "Plan not found" });
    return;
  }

  if (Number(user.balance) < Number(plan.depositRequired)) {
    res.status(400).json({ error: "Insufficient balance to activate this plan" });
    return;
  }

  await db.update(usersTable).set({
    activePlanId: plan.id,
    planActivatedAt: new Date(),
    balance: sql`${usersTable.balance} - ${plan.depositRequired}`,
  }).where(eq(usersTable.id, user.id));

  res.json({ message: `Plan ${plan.name} activated successfully` });
});

export default router;
