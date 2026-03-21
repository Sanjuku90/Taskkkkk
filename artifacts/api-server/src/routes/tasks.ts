import { Router } from "express";
import { db, usersTable, plansTable, taskLogsTable, siteSettingsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

function getTaskDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getResetTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return row?.value ?? fallback;
}

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || !user.activePlanId) {
    const resetAt = getResetTime();
    const secondsUntilReset = Math.max(0, Math.floor((resetAt.getTime() - Date.now()) / 1000));
    res.json({ tasks: [], resetAt: resetAt.toISOString(), secondsUntilReset, plan: null });
    return;
  }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, user.activePlanId)).limit(1);
  if (!plan) {
    const resetAt = getResetTime();
    const secondsUntilReset = Math.max(0, Math.floor((resetAt.getTime() - Date.now()) / 1000));
    res.json({ tasks: [], resetAt: resetAt.toISOString(), secondsUntilReset, plan: null });
    return;
  }

  const today = getTaskDate();
  const completedLogs = await db.select().from(taskLogsTable).where(
    and(eq(taskLogsTable.userId, user.id), eq(taskLogsTable.taskDate, today))
  );

  const completedTaskNumbers = new Set(completedLogs.map(l => l.taskNumber));

  const tasks = [];
  for (let i = 1; i <= plan.tasksPerDay; i++) {
    const completedLog = completedLogs.find(l => l.taskNumber === i);
    tasks.push({
      id: i,
      taskNumber: i,
      completed: completedTaskNumbers.has(i),
      completedAt: completedLog?.completedAt?.toISOString() ?? null,
      gain: Number(plan.gainPerTask),
    });
  }

  const resetAt = getResetTime();
  const secondsUntilReset = Math.max(0, Math.floor((resetAt.getTime() - Date.now()) / 1000));

  res.json({
    tasks,
    resetAt: resetAt.toISOString(),
    secondsUntilReset,
    plan: {
      id: plan.id,
      name: plan.name,
      depositRequired: Number(plan.depositRequired),
      tasksPerDay: plan.tasksPerDay,
      gainPerTask: Number(plan.gainPerTask),
      totalPerDay: Number(plan.totalPerDay),
    },
  });
});

router.post("/:taskId/complete", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const tasksBlocked = await getSetting("tasks_blocked", "false");
  if (tasksBlocked === "true") {
    res.status(400).json({ error: "Tasks are currently blocked by admin" });
    return;
  }

  const taskId = parseInt(req.params.taskId);
  if (isNaN(taskId) || taskId < 1) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || !user.activePlanId) {
    res.status(400).json({ error: "No active plan" });
    return;
  }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, user.activePlanId)).limit(1);
  if (!plan) {
    res.status(400).json({ error: "Plan not found" });
    return;
  }

  if (taskId > plan.tasksPerDay) {
    res.status(400).json({ error: "Task not available in your plan" });
    return;
  }

  const today = getTaskDate();
  const existing = await db.select().from(taskLogsTable).where(
    and(
      eq(taskLogsTable.userId, user.id),
      eq(taskLogsTable.taskDate, today),
      eq(taskLogsTable.taskNumber, taskId)
    )
  ).limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "Task already completed today" });
    return;
  }

  const gain = Number(plan.gainPerTask);

  await db.insert(taskLogsTable).values({
    userId: user.id,
    taskNumber: taskId,
    gain: String(gain),
    taskDate: today,
  });

  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${gain}`,
  }).where(eq(usersTable.id, user.id));

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  res.json({
    message: `Task ${taskId} completed! You earned $${gain.toFixed(2)}`,
    gain,
    newBalance: Number(updatedUser.balance),
  });
});

export default router;
