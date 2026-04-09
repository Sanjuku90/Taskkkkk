import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

const VIP_TIERS = [
  { rank: "Bronze", minDeposit: 0, claimBonus: 0 },
  { rank: "Silver", minDeposit: 1000, claimBonus: 10 },
  { rank: "Gold", minDeposit: 5000, claimBonus: 50 },
  { rank: "Platinum", minDeposit: 15000, claimBonus: 150 },
];

function getVipTier(totalDeposited: number) {
  const tiers = [...VIP_TIERS].reverse();
  return tiers.find((t) => totalDeposited >= t.minDeposit) ?? VIP_TIERS[0];
}

router.post("/claim-bonus", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = req.session.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const approvedDeposits = await db.select().from(transactionsTable).where(
    and(
      eq(transactionsTable.userId, userId),
      eq(transactionsTable.type, "deposit"),
      eq(transactionsTable.status, "approved"),
    ),
  );

  const totalDeposited = approvedDeposits.reduce((s, t) => s + Number(t.amount), 0);
  const tier = getVipTier(totalDeposited);

  if (tier.claimBonus === 0) {
    res.status(400).json({ error: "Aucun bonus à réclamer pour ce palier" });
    return;
  }

  let claimed: string[] = [];
  try { claimed = JSON.parse(user.claimedVipBonuses ?? "[]"); } catch {}

  if (claimed.includes(tier.rank)) {
    res.status(400).json({ error: "Bonus déjà réclamé pour ce palier" });
    return;
  }

  const newClaimed = [...claimed, tier.rank];

  await db.update(usersTable)
    .set({
      balance: sql`${usersTable.balance} + ${tier.claimBonus}`,
      claimedVipBonuses: JSON.stringify(newClaimed),
    })
    .where(eq(usersTable.id, userId));

  await db.insert(transactionsTable).values({
    userId,
    type: "bonus" as any,
    status: "approved",
    amount: String(tier.claimBonus),
    currency: "USDT",
    note: `VIP_BONUS:${tier.rank}`,
  } as any);

  res.json({ success: true, bonusAmount: tier.claimBonus, tier: tier.rank });
});

export default router;
