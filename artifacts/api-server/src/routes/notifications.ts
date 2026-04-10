import { Router } from "express";
import { db, notificationsTable, notificationReadsTable, usersTable } from "@workspace/db";
import { eq, and, or, isNull, desc, inArray } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

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

router.get("/", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const userId = req.session.userId as number;

  const notifs = await db
    .select()
    .from(notificationsTable)
    .where(
      or(
        eq(notificationsTable.targetType, "all"),
        and(eq(notificationsTable.targetType, "user"), eq(notificationsTable.targetUserId, userId))
      )
    )
    .orderBy(desc(notificationsTable.createdAt));

  if (notifs.length === 0) {
    res.json([]);
    return;
  }

  const reads = await db
    .select()
    .from(notificationReadsTable)
    .where(
      and(
        eq(notificationReadsTable.userId, userId),
        inArray(notificationReadsTable.notificationId, notifs.map(n => n.id))
      )
    );

  const readSet = new Set(reads.map(r => r.notificationId));

  res.json(
    notifs.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      targetType: n.targetType,
      createdAt: n.createdAt.toISOString(),
      isRead: readSet.has(n.id),
    }))
  );
});

router.post("/:id/read", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const userId = req.session.userId as number;
  const notifId = parseInt(req.params.id);

  const existing = await db
    .select()
    .from(notificationReadsTable)
    .where(
      and(
        eq(notificationReadsTable.notificationId, notifId),
        eq(notificationReadsTable.userId, userId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(notificationReadsTable).values({
      notificationId: notifId,
      userId,
    });
  }

  res.json({ ok: true });
});

router.post("/read-all", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const userId = req.session.userId as number;

  const notifs = await db
    .select({ id: notificationsTable.id })
    .from(notificationsTable)
    .where(
      or(
        eq(notificationsTable.targetType, "all"),
        and(eq(notificationsTable.targetType, "user"), eq(notificationsTable.targetUserId, userId))
      )
    );

  if (notifs.length === 0) {
    res.json({ ok: true });
    return;
  }

  const reads = await db
    .select()
    .from(notificationReadsTable)
    .where(
      and(
        eq(notificationReadsTable.userId, userId),
        inArray(notificationReadsTable.notificationId, notifs.map(n => n.id))
      )
    );

  const readSet = new Set(reads.map(r => r.notificationId));
  const unread = notifs.filter(n => !readSet.has(n.id));

  if (unread.length > 0) {
    await db.insert(notificationReadsTable).values(
      unread.map(n => ({ notificationId: n.id, userId }))
    );
  }

  res.json({ ok: true });
});

router.get("/admin", async (req, res) => {
  if (!await requireAdmin(req, res)) return;

  const notifs = await db
    .select()
    .from(notificationsTable)
    .orderBy(desc(notificationsTable.createdAt));

  const users = await db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u.username]));

  res.json(
    notifs.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      targetType: n.targetType,
      targetUserId: n.targetUserId,
      targetUsername: n.targetUserId ? (userMap.get(n.targetUserId) ?? null) : null,
      createdAt: n.createdAt.toISOString(),
    }))
  );
});

router.post("/admin", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const userId = req.session.userId as number;

  const { title, message, targetType, targetUserId } = req.body;

  if (!title || typeof title !== "string" || !message || typeof message !== "string") {
    res.status(400).json({ error: "title and message are required" });
    return;
  }

  if (targetType !== "all" && targetType !== "user") {
    res.status(400).json({ error: "targetType must be 'all' or 'user'" });
    return;
  }

  if (targetType === "user" && !targetUserId) {
    res.status(400).json({ error: "targetUserId required when targetType is 'user'" });
    return;
  }

  const [notif] = await db.insert(notificationsTable).values({
    title,
    message,
    targetType,
    targetUserId: targetType === "user" ? Number(targetUserId) : null,
    createdById: userId,
  }).returning();

  res.status(201).json({
    id: notif.id,
    title: notif.title,
    message: notif.message,
    targetType: notif.targetType,
    targetUserId: notif.targetUserId,
    createdAt: notif.createdAt.toISOString(),
  });
});

router.delete("/admin/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const notifId = parseInt(req.params.id);

  await db.delete(notificationsTable).where(eq(notificationsTable.id, notifId));
  res.json({ ok: true });
});

export default router;
