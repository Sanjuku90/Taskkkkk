import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { rateLimit, getClientIp } from "../middleware/rate-limit";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router = Router();

const MAX_ACCOUNTS_PER_IP = 3;

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function getUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, code)).limit(1);
    if (existing.length === 0) return code;
  }
  return generateReferralCode() + Date.now().toString(36).slice(-3).toUpperCase();
}

router.post("/register", rateLimit(10, 15 * 60 * 1000), async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password, username } = parsed.data;
  const referralCodeUsed: string | undefined = typeof req.body.referralCode === "string" ? req.body.referralCode.trim().toUpperCase() : undefined;

  const ip = getClientIp(req);

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.registrationIp, ip));

  if (count >= MAX_ACCOUNTS_PER_IP) {
    res.status(403).json({ error: "Maximum accounts per network reached. Contact support if this is an error." });
    return;
  }

  let referredById: number | undefined;
  if (referralCodeUsed) {
    const [referrer] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, referralCodeUsed)).limit(1);
    if (referrer) referredById = referrer.id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const referralCode = await getUniqueReferralCode();

  const [user] = await db.insert(usersTable).values({
    email,
    username,
    passwordHash,
    registrationIp: ip,
    referralCode,
    referredById: referredById ?? null,
  }).returning();

  req.session.userId = user.id;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: Number(user.balance),
      isAdmin: user.isAdmin,
      isSuspended: user.isSuspended,
      activePlanId: user.activePlanId,
      planActivatedAt: user.planActivatedAt?.toISOString() ?? null,
      referralCode: user.referralCode,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Registration successful",
  });
});

router.post("/login", rateLimit(10, 15 * 60 * 1000), async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.isSuspended) {
    res.status(403).json({ error: "Account suspended" });
    return;
  }

  req.session.userId = user.id;

  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: Number(user.balance),
      isAdmin: user.isAdmin,
      isSuspended: user.isSuspended,
      activePlanId: user.activePlanId,
      planActivatedAt: user.planActivatedAt?.toISOString() ?? null,
      referralCode: user.referralCode,
      createdAt: user.createdAt.toISOString(),
    },
    message: "Login successful",
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    balance: Number(user.balance),
    isAdmin: user.isAdmin,
    isSuspended: user.isSuspended,
    activePlanId: user.activePlanId,
    planActivatedAt: user.planActivatedAt?.toISOString() ?? null,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
