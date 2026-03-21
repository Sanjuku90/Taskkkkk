import { pgTable, serial, integer, boolean, numeric, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const taskLogsTable = pgTable("task_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskNumber: integer("task_number").notNull(),
  gain: numeric("gain", { precision: 18, scale: 6 }).notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  taskDate: text("task_date").notNull(),
});

export const insertTaskLogSchema = createInsertSchema(taskLogsTable).omit({ id: true, completedAt: true });
export type InsertTaskLog = z.infer<typeof insertTaskLogSchema>;
export type TaskLog = typeof taskLogsTable.$inferSelect;

export const bonusTasksTable = pgTable("bonus_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  reward: numeric("reward", { precision: 18, scale: 6 }).notNull(),
  forUserId: integer("for_user_id"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bonusTaskLogsTable = pgTable("bonus_task_logs", {
  id: serial("id").primaryKey(),
  bonusTaskId: integer("bonus_task_id").notNull(),
  userId: integer("user_id").notNull(),
  gain: numeric("gain", { precision: 18, scale: 6 }).notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type BonusTask = typeof bonusTasksTable.$inferSelect;
export type BonusTaskLog = typeof bonusTaskLogsTable.$inferSelect;
