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
