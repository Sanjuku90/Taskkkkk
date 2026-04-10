CREATE TYPE "notification_target" AS ENUM ('all', 'user');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "target_type" "notification_target" DEFAULT 'all' NOT NULL,
  "target_user_id" integer,
  "created_by_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "notifications_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE cascade,
  CONSTRAINT "notifications_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_reads" (
  "id" serial PRIMARY KEY NOT NULL,
  "notification_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "read_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE cascade,
  CONSTRAINT "notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);
