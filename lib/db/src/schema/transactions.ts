import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull().$type<"deposit" | "withdrawal">(),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  currency: text("currency").notNull().$type<"USDT" | "TRX">(),
  status: text("status").notNull().default("pending").$type<"pending" | "approved" | "rejected">(),
  txHash: text("tx_hash"),
  walletAddress: text("wallet_address"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
