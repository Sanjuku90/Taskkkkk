import { pgTable, serial, integer, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";

export const gameSessionsTable = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull().$type<"mines" | "crash" | "coinflip">(),
  betAmount: numeric("bet_amount", { precision: 18, scale: 6 }).notNull(),
  difficulty: text("difficulty").notNull().$type<"easy" | "medium" | "hard">(),
  status: text("status").notNull().default("active").$type<"active" | "won" | "lost" | "cashed_out">(),
  gameState: jsonb("game_state").$type<Record<string, unknown>>(),
  multiplier: numeric("multiplier", { precision: 10, scale: 4 }).default("1"),
  payout: numeric("payout", { precision: 18, scale: 6 }).default("0"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export type GameSession = typeof gameSessionsTable.$inferSelect;
