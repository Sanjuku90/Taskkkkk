import { pgTable, serial, text, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  depositRequired: numeric("deposit_required", { precision: 18, scale: 6 }).notNull(),
  tasksPerDay: integer("tasks_per_day").notNull(),
  gainPerTask: numeric("gain_per_task", { precision: 18, scale: 6 }).notNull(),
  totalPerDay: numeric("total_per_day", { precision: 18, scale: 6 }).notNull(),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
