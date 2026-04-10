ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_activated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_subscription_selected" boolean DEFAULT false NOT NULL;
