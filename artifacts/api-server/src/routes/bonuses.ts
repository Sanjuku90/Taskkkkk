import { Router } from "express";
import { db, usersTable, transactionsTable, taskLogsTable, bonusCatalogTable, bonusClaimLogsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import type { BonusCatalogType } from "@workspace/db";

const router = Router();

async function checkCondition(
  userId: number,
  type: BonusCatalogType,
  conditionValue: number
): Promise<{ eligible: boolean; progress: number; total: number }> {
  switch (type) {
    case "referral": {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(eq(usersTable.referredById, userId));
      const count = row?.count ?? 0;
      return { eligible: count >= conditionValue, progress: Math.min(count, conditionValue), total: conditionValue };
    }

    case "first_deposit": {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactionsTable)
        .where(and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.type, "deposit"),
          eq(transactionsTable.status, "approved")
        ));
      const count = row?.count ?? 0;
      return { eligible: count >= 1, progress: Math.min(count, 1), total: 1 };
    }

    case "deposit_milestone": {
      const [row] = await db
        .select({ total: sql<string>`coalesce(sum(amount::numeric), 0)::text` })
        .from(transactionsTable)
        .where(and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.type, "deposit"),
          eq(transactionsTable.status, "approved")
        ));
      const total = Number(row?.total ?? 0);
      return { eligible: total >= conditionValue, progress: Math.min(total, conditionValue), total: conditionValue };
    }

    case "plan_activation": {
      const [user] = await db
        .select({ activePlanId: usersTable.activePlanId })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      const hasPlan = !!user?.activePlanId;
      return { eligible: hasPlan, progress: hasPlan ? 1 : 0, total: 1 };
    }

    case "task_streak": {
      const logs = await db
        .select({ taskDate: taskLogsTable.taskDate })
        .from(taskLogsTable)
        .where(eq(taskLogsTable.userId, userId));
      const uniqueDates = new Set(logs.map(l => l.taskDate));
      let streak = 0;
      const today = new Date();
      for (let i = 0; i <= conditionValue + 60; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        if (uniqueDates.has(dateStr)) {
          streak++;
          if (streak >= conditionValue) break;
        } else if (i > 0) {
          break;
        }
      }
      return { eligible: streak >= conditionValue, progress: Math.min(streak, conditionValue), total: conditionValue };
    }

    default:
      return { eligible: false, progress: 0, total: 1 };
  }
}

function progressLabel(type: BonusCatalogType, progress: number, total: number): string {
  switch (type) {
    case "referral":
      return `${progress} / ${total} ${total === 1 ? "friend" : "friends"} invited`;
    case "first_deposit":
      return progress >= 1 ? "First deposit made" : "No deposit yet";
    case "deposit_milestone":
      return `$${progress.toFixed(2)} / $${total.toFixed(2)} deposited`;
    case "plan_activation":
      return progress >= 1 ? "Plan activated" : "No active plan";
    case "task_streak":
      return `${progress} / ${total} consecutive ${total === 1 ? "day" : "days"}`;
    default:
      return `${progress} / ${total}`;
  }
}

router.get("/catalog", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = req.session.userId;

  const bonuses = await db
    .select()
    .from(bonusCatalogTable)
    .where(eq(bonusCatalogTable.isActive, true));

  const claims = await db
    .select()
    .from(bonusClaimLogsTable)
    .where(eq(bonusClaimLogsTable.userId, userId));
  const claimedIds = new Set(claims.map(c => c.bonusCatalogId));

  const result = await Promise.all(bonuses.map(async bonus => {
    const cv = Number(bonus.conditionValue);
    const claimed = claimedIds.has(bonus.id);
    const { eligible, progress, total } = claimed
      ? { eligible: true, progress: cv, total: cv }
      : await checkCondition(userId, bonus.type as BonusCatalogType, cv);

    return {
      id: bonus.id,
      type: bonus.type,
      title: bonus.title,
      description: bonus.description,
      reward: Number(bonus.reward),
      conditionValue: cv,
      eligible,
      claimed,
      claimedAt: claims.find(c => c.bonusCatalogId === bonus.id)?.claimedAt?.toISOString() ?? null,
      progress,
      total,
      progressLabel: progressLabel(bonus.type as BonusCatalogType, progress, total),
    };
  }));

  res.json(result);
});

router.post("/catalog/:id/claim", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = req.session.userId;
  const bonusId = parseInt(req.params.id);
  if (isNaN(bonusId)) {
    res.status(400).json({ error: "Invalid bonus ID" });
    return;
  }

  const [bonus] = await db
    .select()
    .from(bonusCatalogTable)
    .where(and(eq(bonusCatalogTable.id, bonusId), eq(bonusCatalogTable.isActive, true)))
    .limit(1);

  if (!bonus) {
    res.status(404).json({ error: "Bonus not found or not active" });
    return;
  }

  const [alreadyClaimed] = await db
    .select()
    .from(bonusClaimLogsTable)
    .where(and(eq(bonusClaimLogsTable.bonusCatalogId, bonusId), eq(bonusClaimLogsTable.userId, userId)))
    .limit(1);

  if (alreadyClaimed) {
    res.status(400).json({ error: "Bonus already claimed" });
    return;
  }

  const cv = Number(bonus.conditionValue);
  const { eligible } = await checkCondition(userId, bonus.type as BonusCatalogType, cv);

  if (!eligible) {
    res.status(400).json({ error: "Condition not met yet" });
    return;
  }

  const gain = Number(bonus.reward);

  await db.insert(bonusClaimLogsTable).values({
    bonusCatalogId: bonusId,
    userId,
    gain: String(gain),
  });

  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${gain}`,
  }).where(eq(usersTable.id, userId));

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.json({
    message: `Bonus claimed! You earned $${gain.toFixed(2)}`,
    gain,
    newBalance: Number(updatedUser.balance),
  });
});

router.get("/referral", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = req.session.userId;

  const [user] = await db
    .select({ referralCode: usersTable.referralCode })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const referredUsers = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      createdAt: usersTable.createdAt,
      activePlanId: usersTable.activePlanId,
    })
    .from(usersTable)
    .where(eq(usersTable.referredById, userId));

  const referredWithStats = await Promise.all(referredUsers.map(async (u) => {
    const [depRow] = await db
      .select({ total: sql<string>`coalesce(sum(amount::numeric), 0)::text` })
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.userId, u.id),
        eq(transactionsTable.type, "deposit"),
        eq(transactionsTable.status, "approved")
      ));
    return {
      id: u.id,
      username: u.username,
      joinedAt: u.createdAt?.toISOString() ?? null,
      hasActivePlan: !!u.activePlanId,
      totalDeposited: Number(depRow?.total ?? 0),
    };
  }));

  const referralBonusClaims = await db
    .select({ gain: bonusClaimLogsTable.gain })
    .from(bonusClaimLogsTable)
    .innerJoin(bonusCatalogTable, eq(bonusClaimLogsTable.bonusCatalogId, bonusCatalogTable.id))
    .where(and(
      eq(bonusClaimLogsTable.userId, userId),
      eq(bonusCatalogTable.type, "referral")
    ));
  const totalReferralEarned = referralBonusClaims.reduce((s, r) => s + Number(r.gain), 0);

  res.json({
    referralCode: user?.referralCode ?? null,
    referralCount: referredWithStats.length,
    referredUsers: referredWithStats,
    totalReferralEarned,
  });
});

export default router;
