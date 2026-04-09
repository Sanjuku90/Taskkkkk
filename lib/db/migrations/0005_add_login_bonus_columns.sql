ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_bonus_date" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "claimed_vip_bonuses" text DEFAULT '[]';
