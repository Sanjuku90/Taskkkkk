import { pgTable, serial, text, boolean, numeric, integer, timestamp } from "drizzle-orm/pg-core";

export type BonusCatalogType = "referral" | "first_deposit" | "deposit_milestone" | "plan_activation" | "task_streak";

export const bonusCatalogTable = pgTable("bonus_catalog", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().$type<BonusCatalogType>(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reward: numeric("reward", { precision: 18, scale: 6 }).notNull(),
  conditionValue: numeric("condition_value", { precision: 18, scale: 6 }).notNull().default("1"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bonusClaimLogsTable = pgTable("bonus_claim_logs", {
  id: serial("id").primaryKey(),
  bonusCatalogId: integer("bonus_catalog_id").notNull(),
  userId: integer("user_id").notNull(),
  gain: numeric("gain", { precision: 18, scale: 6 }).notNull(),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
});

export type BonusCatalog = typeof bonusCatalogTable.$inferSelect;
export type BonusClaimLog = typeof bonusClaimLogsTable.$inferSelect;
