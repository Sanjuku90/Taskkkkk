ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_activated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "registration_ip" varchar(45);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" varchar(16);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_id" integer;
--> statement-breakpoint
DO $$ BEGIN
  BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
