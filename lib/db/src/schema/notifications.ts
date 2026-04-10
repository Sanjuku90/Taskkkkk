import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationTargetEnum = pgEnum("notification_target", ["all", "user"]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  targetType: notificationTargetEnum("target_type").notNull().default("all"),
  targetUserId: integer("target_user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdById: integer("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationReadsTable = pgTable("notification_reads", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notificationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NotificationRead = typeof notificationReadsTable.$inferSelect;
