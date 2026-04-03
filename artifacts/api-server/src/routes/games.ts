import { Router } from "express";
import { db, usersTable, gameSessionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();
const MIN_BET = 9;
const TOTAL_CELLS = 25;

function requireAuth(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function generateMines(total: number, count: number): number[] {
  const cells = Array.from({ length: total }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, count).sort((a, b) => a - b);
}

function getMinesCount(difficulty: string): number {
  if (difficulty === "easy") return 5;
  if (difficulty === "medium") return 10;
  if (difficulty === "hard") return 18;
  return 7;
}

function getMinesMultiplier(mines: number, revealed: number): number {
  let multiplier = 1;
  for (let i = 0; i < revealed; i++) {
    multiplier *= (TOTAL_CELLS - i) / (TOTAL_CELLS - mines - i);
  }
  // 20% house edge — gains difficiles à atteindre
  return Math.round(multiplier * 0.80 * 100) / 100;
}

function generateCrashPoint(difficulty: string): number {
  const r = Math.random();
  // 25% chance d'un crash immédiat (1.01×) pour tous les niveaux
  if (r < 0.25) return 1.01;
  const r2 = Math.random();
  // Moyennes très basses : easy ~2×, medium ~1.4×, hard ~1.15×
  const mean = difficulty === "easy" ? 2.0 : difficulty === "hard" ? 1.15 : 1.4;
  const crashPoint = Math.max(1.01, -mean * Math.log(r2));
  return Math.round(crashPoint * 100) / 100;
}

function getCrashMultiplierAtTime(startedAt: Date): number {
  const elapsed = (Date.now() - startedAt.getTime()) / 1000;
  return Math.round(Math.exp(0.07 * elapsed) * 100) / 100;
}

// ─── Coin Flip ─────────────────────────────────────────────────────────────

router.post("/coinflip", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { betAmount, choice, difficulty } = req.body;
  if (!betAmount || !choice || !difficulty) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  if (!["pile", "face"].includes(choice)) {
    res.status(400).json({ error: "Invalid choice" });
    return;
  }
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    res.status(400).json({ error: "Invalid difficulty" });
    return;
  }

  const amount = Number(betAmount);
  if (isNaN(amount) || amount < MIN_BET) {
    res.status(400).json({ error: `Mise minimum : $${MIN_BET}` });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user || Number(user.balance) < amount) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  // Multiplicateurs réduits — marge maison élevée
  const multipliers: Record<string, number> = { easy: 1.4, medium: 1.6, hard: 1.85 };
  const multiplier = multipliers[difficulty];

  const result = Math.random() < 0.5 ? "pile" : "face";
  const won = result === choice;
  const payout = won ? Math.round(amount * multiplier * 100) / 100 : 0;

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amount}` })
    .where(eq(usersTable.id, req.session.userId!));

  if (won) {
    await db.update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${payout}` })
      .where(eq(usersTable.id, req.session.userId!));
  }

  const [session] = await db.insert(gameSessionsTable).values({
    userId: req.session.userId!,
    gameType: "coinflip",
    betAmount: String(amount),
    difficulty,
    status: won ? "won" : "lost",
    multiplier: String(won ? multiplier : 0),
    payout: String(payout),
    gameState: { choice, result },
    endedAt: new Date(),
  }).returning();

  const newBalance = Number(user.balance) - amount + payout;
  res.json({ result, won, payout, multiplier, sessionId: session.id, newBalance });
});

// ─── Mines ─────────────────────────────────────────────────────────────────

router.post("/mines/start", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { betAmount, difficulty } = req.body;
  if (!betAmount || !difficulty) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    res.status(400).json({ error: "Invalid difficulty" });
    return;
  }

  const amount = Number(betAmount);
  if (isNaN(amount) || amount < MIN_BET) {
    res.status(400).json({ error: `Mise minimum : $${MIN_BET}` });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user || Number(user.balance) < amount) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amount}` })
    .where(eq(usersTable.id, req.session.userId!));

  const mineCount = getMinesCount(difficulty);
  const mines = generateMines(TOTAL_CELLS, mineCount);

  const [session] = await db.insert(gameSessionsTable).values({
    userId: req.session.userId!,
    gameType: "mines",
    betAmount: String(amount),
    difficulty,
    status: "active",
    gameState: { mines, revealed: [], mineCount },
    multiplier: "1",
    payout: "0",
  }).returning();

  res.json({ sessionId: session.id, mineCount, totalCells: TOTAL_CELLS });
});

router.post("/mines/:id/reveal", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const sessionId = Number(req.params.id);
  const { cellIndex } = req.body;

  if (isNaN(sessionId) || cellIndex === undefined || cellIndex < 0 || cellIndex >= TOTAL_CELLS) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [session] = await db.select().from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, sessionId)).limit(1);

  if (!session || session.userId !== req.session.userId!) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status !== "active") {
    res.status(400).json({ error: "Game is not active" });
    return;
  }

  const state = session.gameState as { mines: number[]; revealed: number[]; mineCount: number };

  if (state.revealed.includes(cellIndex)) {
    res.status(400).json({ error: "Cell already revealed" });
    return;
  }

  const isMine = state.mines.includes(cellIndex);

  if (isMine) {
    await db.update(gameSessionsTable)
      .set({
        status: "lost",
        gameState: { ...state, revealed: [...state.revealed, cellIndex], exploded: cellIndex },
        multiplier: "0",
        payout: "0",
        endedAt: new Date(),
      })
      .where(eq(gameSessionsTable.id, sessionId));

    res.json({ isMine: true, mines: state.mines, revealed: [...state.revealed, cellIndex], status: "lost", payout: 0 });
    return;
  }

  const newRevealed = [...state.revealed, cellIndex];
  const multiplier = getMinesMultiplier(state.mineCount, newRevealed.length);
  const potentialPayout = Math.round(Number(session.betAmount) * multiplier * 100) / 100;
  const safeLeft = TOTAL_CELLS - state.mineCount - newRevealed.length;
  const autoWin = safeLeft === 0;

  await db.update(gameSessionsTable)
    .set({
      gameState: { ...state, revealed: newRevealed },
      multiplier: String(multiplier),
      payout: String(potentialPayout),
      ...(autoWin ? { status: "won" as const, endedAt: new Date() } : {}),
    })
    .where(eq(gameSessionsTable.id, sessionId));

  if (autoWin) {
    await db.update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${potentialPayout}` })
      .where(eq(usersTable.id, req.session.userId!));
  }

  res.json({
    isMine: false,
    revealed: newRevealed,
    multiplier,
    potentialPayout,
    status: autoWin ? "won" : "active",
  });
});

router.post("/mines/:id/cashout", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const sessionId = Number(req.params.id);
  const [session] = await db.select().from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, sessionId)).limit(1);

  if (!session || session.userId !== req.session.userId!) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status !== "active") {
    res.status(400).json({ error: "Game is not active" });
    return;
  }

  const state = session.gameState as { mines: number[]; revealed: number[]; mineCount: number };
  if (state.revealed.length === 0) {
    res.status(400).json({ error: "Révèle au moins une case avant d'encaisser" });
    return;
  }

  const multiplier = getMinesMultiplier(state.mineCount, state.revealed.length);
  const payout = Math.round(Number(session.betAmount) * multiplier * 100) / 100;

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${payout}` })
    .where(eq(usersTable.id, req.session.userId!));

  await db.update(gameSessionsTable)
    .set({ status: "cashed_out", multiplier: String(multiplier), payout: String(payout), endedAt: new Date() })
    .where(eq(gameSessionsTable.id, sessionId));

  res.json({ payout, multiplier, status: "cashed_out" });
});

// ─── Crash ─────────────────────────────────────────────────────────────────

router.post("/crash/start", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const { betAmount, difficulty } = req.body;
  if (!betAmount || !difficulty) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    res.status(400).json({ error: "Invalid difficulty" });
    return;
  }

  const amount = Number(betAmount);
  if (isNaN(amount) || amount < MIN_BET) {
    res.status(400).json({ error: `Mise minimum : $${MIN_BET}` });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user || Number(user.balance) < amount) {
    res.status(400).json({ error: "Solde insuffisant" });
    return;
  }

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amount}` })
    .where(eq(usersTable.id, req.session.userId!));

  const crashPoint = generateCrashPoint(difficulty);

  const [session] = await db.insert(gameSessionsTable).values({
    userId: req.session.userId!,
    gameType: "crash",
    betAmount: String(amount),
    difficulty,
    status: "active",
    gameState: { crashPoint },
    multiplier: "1",
    payout: "0",
  }).returning();

  res.json({ sessionId: session.id, startedAt: session.startedAt.toISOString() });
});

router.get("/crash/:id", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const sessionId = Number(req.params.id);
  const [session] = await db.select().from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, sessionId)).limit(1);

  if (!session || session.userId !== req.session.userId!) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status !== "active") {
    res.json({
      status: session.status,
      multiplier: Number(session.multiplier),
      payout: Number(session.payout),
    });
    return;
  }

  const state = session.gameState as { crashPoint: number };
  const currentMultiplier = getCrashMultiplierAtTime(session.startedAt);
  const crashed = currentMultiplier >= state.crashPoint;

  if (crashed) {
    await db.update(gameSessionsTable)
      .set({ status: "lost", multiplier: String(state.crashPoint), payout: "0", endedAt: new Date() })
      .where(eq(gameSessionsTable.id, sessionId));
    res.json({ status: "lost", crashPoint: state.crashPoint, currentMultiplier: state.crashPoint });
    return;
  }

  res.json({ status: "active", currentMultiplier });
});

router.post("/crash/:id/cashout", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const sessionId = Number(req.params.id);
  const [session] = await db.select().from(gameSessionsTable)
    .where(eq(gameSessionsTable.id, sessionId)).limit(1);

  if (!session || session.userId !== req.session.userId!) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status !== "active") {
    res.status(400).json({ error: "Partie déjà terminée" });
    return;
  }

  const state = session.gameState as { crashPoint: number };
  const currentMultiplier = getCrashMultiplierAtTime(session.startedAt);

  if (currentMultiplier >= state.crashPoint) {
    await db.update(gameSessionsTable)
      .set({ status: "lost", multiplier: String(state.crashPoint), payout: "0", endedAt: new Date() })
      .where(eq(gameSessionsTable.id, sessionId));
    res.status(400).json({ error: "Crashé avant encaissement", crashPoint: state.crashPoint });
    return;
  }

  const payout = Math.round(Number(session.betAmount) * currentMultiplier * 100) / 100;

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${payout}` })
    .where(eq(usersTable.id, req.session.userId!));

  await db.update(gameSessionsTable)
    .set({ status: "cashed_out", multiplier: String(currentMultiplier), payout: String(payout), endedAt: new Date() })
    .where(eq(gameSessionsTable.id, sessionId));

  res.json({ payout, multiplier: currentMultiplier, status: "cashed_out" });
});

// ─── History ────────────────────────────────────────────────────────────────

router.get("/history", async (req, res) => {
  if (!requireAuth(req, res)) return;

  const sessions = await db.select().from(gameSessionsTable)
    .where(eq(gameSessionsTable.userId, req.session.userId!))
    .orderBy(desc(gameSessionsTable.startedAt))
    .limit(20);

  res.json(sessions.map(s => ({
    id: s.id,
    gameType: s.gameType,
    betAmount: Number(s.betAmount),
    difficulty: s.difficulty,
    status: s.status,
    multiplier: Number(s.multiplier),
    payout: Number(s.payout),
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
  })));
});

export default router;
