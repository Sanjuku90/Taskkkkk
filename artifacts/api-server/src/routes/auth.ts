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

router.post("/register", rateLimit(10, 15 * 60 * 1000), async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password, username } = parsed.data;

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

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email,
    username,
    passwordHash,
    registrationIp: ip,
  }).returning();

  req.session.userId = user.id;

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
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
