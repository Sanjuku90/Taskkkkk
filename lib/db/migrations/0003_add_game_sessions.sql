CREATE TABLE IF NOT EXISTS "game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_type" text NOT NULL,
	"bet_amount" numeric(18, 6) NOT NULL,
	"difficulty" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"game_state" jsonb,
	"multiplier" numeric(10, 4) DEFAULT '1',
	"payout" numeric(18, 6) DEFAULT '0',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
