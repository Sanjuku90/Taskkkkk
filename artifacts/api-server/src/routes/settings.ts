import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function getSetting(key: string, fallback: string): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key)).limit(1);
  return row?.value ?? fallback;
}

router.get("/", async (_req, res) => {
  const announcementEnabled = (await getSetting("announcement_enabled", "false")) === "true";
  const announcement = await getSetting("announcement", "");

  res.json({
    announcementEnabled,
    announcement: announcementEnabled ? announcement : "",
  });
});

export default router;
