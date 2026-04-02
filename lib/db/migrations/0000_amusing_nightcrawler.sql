CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"balance" numeric(18, 6) DEFAULT '0' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"active_plan_id" integer,
	"plan_activated_at" timestamp,
	"registration_ip" varchar(45),
	"referral_code" varchar(16),
	"referred_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"deposit_required" numeric(18, 6) NOT NULL,
	"tasks_per_day" integer NOT NULL,
	"gain_per_task" numeric(18, 6) NOT NULL,
	"total_per_day" numeric(18, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bonus_task_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"bonus_task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"gain" numeric(18, 6) NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bonus_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"reward" numeric(18, 6) NOT NULL,
	"for_user_id" integer,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task_number" integer NOT NULL,
	"gain" numeric(18, 6) NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"task_date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"wallet_address" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "bonus_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reward" numeric(18, 6) NOT NULL,
	"condition_value" numeric(18, 6) DEFAULT '1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bonus_claim_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"bonus_catalog_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"gain" numeric(18, 6) NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
