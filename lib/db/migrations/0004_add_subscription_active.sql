ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_active" boolean DEFAULT false NOT NULL;
