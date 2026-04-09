import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, or, sql, count, sum, and } from "drizzle-orm";

const router = Router();

function getVipFeeRate(totalDeposited: number): number {
  if (totalDeposited >= 15000) return 0;
  if (totalDeposited >= 5000) return 0.03;
  return 0.05;
}

router.post("/", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { recipientIdentifier, amount: rawAmount } = req.body ?? {};
  if (!recipientIdentifier || typeof recipientIdentifier !== "string" || !rawAmount) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const amount = Number(rawAmount);

  if (amount < 1) {
    res.status(400).json({ error: "Minimum transfer amount is $1" });
    return;
  }

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!sender) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const [recipient] = await db.select().from(usersTable).where(
    or(
      eq(usersTable.email, recipientIdentifier.toLowerCase()),
      eq(usersTable.username, recipientIdentifier)
    )
  ).limit(1);

  if (!recipient) {
    res.status(404).json({ error: "Recipient not found" });
    return;
  }

  if (recipient.id === sender.id) {
    res.status(400).json({ error: "Cannot transfer to yourself" });
    return;
  }

  // Check recipient's referral count
  const [recipientReferralCount] = await db
    .select({ total: count() })
    .from(usersTable)
    .where(eq(usersTable.referredById, recipient.id));

  const recipientHasFilleuls = recipientReferralCount && recipientReferralCount.total >= 1;

  if (recipientHasFilleuls) {
    // Recipient has filleuls — sender must also have at least 1 filleul to be allowed
    const [senderReferralCount] = await db
      .select({ total: count() })
      .from(usersTable)
      .where(eq(usersTable.referredById, sender.id));

    if (!senderReferralCount || senderReferralCount.total < 1) {
      res.status(403).json({ error: "Pour effectuer un transfert vers cet utilisateur, vous devez avoir parrainé au moins 1 utilisateur." });
      return;
    }
  }

  // Compute sender's total approved deposits to determine VIP fee rate
  const [depositSum] = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.userId, sender.id),
      eq(transactionsTable.type, "deposit"),
      eq(transactionsTable.status, "approved"),
    ));

  const totalDeposited = Number(depositSum?.total ?? 0);
  const feeRate = getVipFeeRate(totalDeposited);

  const fee = Math.round(amount * feeRate * 100) / 100;
  const totalDeducted = Math.round((amount + fee) * 100) / 100;

  if (Number(sender.balance) < totalDeducted) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} - ${totalDeducted}`,
  }).where(eq(usersTable.id, sender.id));

  await db.update(usersTable).set({
    balance: sql`${usersTable.balance} + ${amount}`,
  }).where(eq(usersTable.id, recipient.id));

  await db.insert(transactionsTable).values([
    {
      userId: sender.id,
      type: "transfer" as any,
      amount: String(totalDeducted),
      currency: "USDT",
      status: "approved",
      note: `OUT:${recipient.username}`,
    },
    {
      userId: recipient.id,
      type: "transfer" as any,
      amount: String(amount),
      currency: "USDT",
      status: "approved",
      note: `IN:${sender.username}`,
    },
  ]);

  res.json({
    message: "Transfer successful",
    amountSent: amount,
    fee,
    feeRate: feeRate * 100,
    totalDeducted,
    recipient: recipient.username,
  });
});

export default router;
