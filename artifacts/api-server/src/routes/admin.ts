import { Router } from "express";
import { db, usersTable, plansTable, transactionsTable, taskLogsTable, siteSettingsTable, bonusTasksTable, bonusTaskLogsTable } from "@workspace/db";
import { eq, desc, sql, sum, and, or, isNull } from "drizzle-orm";
import { SuspendUserBody, AddBonusBody, ValidateTransactionBody, UpdateAdminSettingsBody } from "@workspace/api-zod";
const router = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || !user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

async function getSetting(key: string, fallback: string): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return row?.value ?? fallback;
}

async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettingsTable).set({ value }).where(eq(siteSettingsTable.key, key));
  } else {
    await db.insert(siteSettingsTable).values({ key, value });
  }
}

router.get("/stats", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [activeUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.isSuspended, false));

  const pendingTxs = await db.select().from(transactionsTable).where(eq(transactionsTable.status, "pending"));
  const pendingDeposits = pendingTxs.filter(t => t.type === "deposit").length;
  const pendingWithdrawals = pendingTxs.filter(t => t.type === "withdrawal").length;

  const approvedTxs = await db.select().from(transactionsTable).where(eq(transactionsTable.status, "approved"));
  const totalDeposited = approvedTxs.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawn = approvedTxs.filter(t => t.type === "withdrawal").reduce((s, t) => s + Number(t.amount), 0);

  res.json({
    totalUsers: totalUsers.count,
    activeUsers: activeUsers.count,
    pendingDeposits,
    pendingWithdrawals,
    totalDeposited,
    totalWithdrawn,
  });
});

router.get("/users", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  const plans = await db.select().from(plansTable);
  const planMap = new Map(plans.map(p => [p.id, p.name]));

  const allTxs = await db.select().from(transactionsTable).where(eq(transactionsTable.status, "approved"));

  res.json(users.map(u => {
    const userTxs = allTxs.filter(t => t.userId === u.id);
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      balance: Number(u.balance),
      isAdmin: u.isAdmin,
      isSuspended: u.isSuspended,
      activePlanId: u.activePlanId,
      planName: u.activePlanId ? (planMap.get(u.activePlanId) ?? null) : null,
      registrationIp: u.registrationIp ?? null,
      createdAt: u.createdAt.toISOString(),
      totalDeposited: userTxs.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0),
      totalWithdrawn: userTxs.filter(t => t.type === "withdrawal").reduce((s, t) => s + Number(t.amount), 0),
    };
  }));
});

router.get("/users/:userId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const userId = parseInt(req.params.userId);
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!u) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const plans = await db.select().from(plansTable);
  const planMap = new Map(plans.map(p => [p.id, p.name]));

  const userTxs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .where(eq(transactionsTable.status, "approved"));

  res.json({
    id: u.id,
    email: u.email,
    username: u.username,
    balance: Number(u.balance),
    isAdmin: u.isAdmin,
    isSuspended: u.isSuspended,
    activePlanId: u.activePlanId,
    planName: u.activePlanId ? (planMap.get(u.activePlanId) ?? null) : null,
    registrationIp: u.registrationIp ?? null,
    createdAt: u.createdAt.toISOString(),
    totalDeposited: userTxs.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0),
    totalWithdrawn: userTxs.filter(t => t.type === "withdrawal").reduce((s, t) => s + Number(t.amount), 0),
  });
});

router.post("/users/:userId/suspend", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const parsed = SuspendUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const userId = parseInt(req.params.userId);
  await db.update(usersTable).set({ isSuspended: parsed.data.suspended }).where(eq(usersTable.id, userId));

  res.json({ message: parsed.data.suspended ? "User suspended" : "User reactivated" });
});

router.post("/users/:userId/bonus", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const parsed = AddBonusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const userId = parseInt(req.params.userId);
  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${parsed.data.amount}`,
  }).where(eq(usersTable.id, userId));

  res.json({ message: `Bonus of $${parsed.data.amount} added` });
});

router.get("/transactions", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const txs = await db.select({
    id: transactionsTable.id,
    userId: transactionsTable.userId,
    type: transactionsTable.type,
    amount: transactionsTable.amount,
    currency: transactionsTable.currency,
    status: transactionsTable.status,
    txHash: transactionsTable.txHash,
    walletAddress: transactionsTable.walletAddress,
    createdAt: transactionsTable.createdAt,
    updatedAt: transactionsTable.updatedAt,
    username: usersTable.username,
    email: usersTable.email,
  })
  .from(transactionsTable)
  .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
  .orderBy(desc(transactionsTable.createdAt));

  res.json(txs.map(tx => ({
    id: tx.id,
    userId: tx.userId,
    username: tx.username ?? "",
    email: tx.email ?? "",
    type: tx.type,
    amount: Number(tx.amount),
    currency: tx.currency,
    status: tx.status,
    txHash: tx.txHash,
    walletAddress: tx.walletAddress,
    note: tx.note ?? null,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  })));
});

router.post("/transactions/:txId/validate", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const parsed = ValidateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const txId = parseInt(req.params.txId);
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txId)).limit(1);

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (tx.status !== "pending") {
    res.status(400).json({ error: "Transaction already processed" });
    return;
  }

  if (parsed.data.action === "approve") {
    await db.update(transactionsTable).set({
      status: "approved",
      updatedAt: new Date(),
    }).where(eq(transactionsTable.id, txId));

    if (tx.type === "deposit") {
      await db.update(usersTable).set({
        balance: sql`${usersTable.balance} + ${Number(tx.amount)}`,
      }).where(eq(usersTable.id, tx.userId));
    } else if (tx.type === "withdrawal") {
      await db.update(usersTable).set({
        balance: sql`${usersTable.balance} - ${Number(tx.amount)}`,
      }).where(eq(usersTable.id, tx.userId));
    }

    res.json({ message: "Transaction approved" });
  } else {
    await db.update(transactionsTable).set({
      status: "rejected",
      note: parsed.data.note ?? null,
      updatedAt: new Date(),
    }).where(eq(transactionsTable.id, txId));

    res.json({ message: "Transaction rejected" });
  }
});

router.get("/settings", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  res.json({
    maintenanceMode: (await getSetting("maintenance_mode", "false")) === "true",
    maintenanceMessage: await getSetting("maintenance_message", "Site is under maintenance. Please check back later."),
    tasksBlocked: (await getSetting("tasks_blocked", "false")) === "true",
    withdrawalsBlocked: (await getSetting("withdrawals_blocked", "false")) === "true",
    depositAddress: await getSetting("deposit_address", "TAB1oeEKDS5NATwFAaUrTioDU9djX7anyS"),
  });
});

router.post("/settings", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const parsed = UpdateAdminSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { maintenanceMode, maintenanceMessage, tasksBlocked, withdrawalsBlocked, depositAddress } = parsed.data;

  await setSetting("maintenance_mode", String(maintenanceMode));
  await setSetting("maintenance_message", maintenanceMessage);
  await setSetting("tasks_blocked", String(tasksBlocked));
  await setSetting("withdrawals_blocked", String(withdrawalsBlocked));
  await setSetting("deposit_address", depositAddress);

  res.json({ message: "Settings updated" });
});

router.get("/bonus-tasks", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const tasks = await db.select().from(bonusTasksTable).orderBy(desc(bonusTasksTable.createdAt));

  const logs = await db.select().from(bonusTaskLogsTable);
  const completionCounts = new Map<number, number>();
  for (const log of logs) {
    completionCounts.set(log.bonusTaskId, (completionCounts.get(log.bonusTaskId) ?? 0) + 1);
  }

  const users = await db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u.username]));

  res.json(tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    reward: Number(t.reward),
    forUserId: t.forUserId,
    forUsername: t.forUserId ? (userMap.get(t.forUserId) ?? null) : null,
    expiresAt: t.expiresAt?.toISOString() ?? null,
    isActive: t.isActive,
    completions: completionCounts.get(t.id) ?? 0,
    createdAt: t.createdAt.toISOString(),
  })));
});

router.post("/bonus-tasks", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const { title, description, reward, forUserId, expiresAt } = req.body;
  if (!title || typeof title !== "string" || !reward || typeof reward !== "number" || reward <= 0) {
    res.status(400).json({ error: "Invalid input: title and reward are required" });
    return;
  }

  const [task] = await db.insert(bonusTasksTable).values({
    title,
    description: description ?? null,
    reward: String(reward),
    forUserId: forUserId ?? null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    isActive: true,
  }).returning();

  res.status(201).json({
    id: task.id,
    title: task.title,
    description: task.description,
    reward: Number(task.reward),
    forUserId: task.forUserId,
    expiresAt: task.expiresAt?.toISOString() ?? null,
    isActive: task.isActive,
    createdAt: task.createdAt.toISOString(),
  });
});

router.patch("/bonus-tasks/:taskId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const taskId = parseInt(req.params.taskId);
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  await db.update(bonusTasksTable).set({ isActive }).where(eq(bonusTasksTable.id, taskId));
  res.json({ message: isActive ? "Bonus task activated" : "Bonus task deactivated" });
});

router.delete("/bonus-tasks/:taskId", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const taskId = parseInt(req.params.taskId);
  await db.delete(bonusTaskLogsTable).where(eq(bonusTaskLogsTable.bonusTaskId, taskId));
  await db.delete(bonusTasksTable).where(eq(bonusTasksTable.id, taskId));
  res.json({ message: "Bonus task deleted" });
});

export default router;
