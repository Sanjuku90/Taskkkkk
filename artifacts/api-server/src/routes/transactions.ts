import { Router } from "express";
import { db, usersTable, transactionsTable, siteSettingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateTransactionBody } from "@workspace/api-zod";

const router = Router();

async function getSetting(key: string, fallback: string): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return row?.value ?? fallback;
}

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.session.userId))
    .orderBy(desc(transactionsTable.createdAt));

  res.json(txs.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    currency: tx.currency,
    status: tx.status,
    txHash: tx.txHash,
    walletAddress: tx.walletAddress,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  })));
});

router.post("/", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { type, amount, currency, txHash, walletAddress } = parsed.data;

  if (type === "withdrawal") {
    const withdrawalsBlocked = await getSetting("withdrawals_blocked", "false");
    if (withdrawalsBlocked === "true") {
      res.status(400).json({ error: "Withdrawals are currently blocked" });
      return;
    }

    if (amount < 60) {
      res.status(400).json({ error: "Minimum withdrawal amount is $60" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (Number(user.balance) < amount) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }
  }

  if (amount <= 0) {
    res.status(400).json({ error: "Amount must be positive" });
    return;
  }

  const [tx] = await db.insert(transactionsTable).values({
    userId: req.session.userId,
    type,
    amount: String(amount),
    currency,
    status: "pending",
    txHash: txHash ?? null,
    walletAddress: walletAddress ?? null,
  }).returning();

  res.status(201).json({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    currency: tx.currency,
    status: tx.status,
    txHash: tx.txHash,
    walletAddress: tx.walletAddress,
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  });
});

export default router;
