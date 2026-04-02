import { pool } from "@workspace/db";

console.log("Running migrations...");

await pool.query(`
  ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(16),
  ADD COLUMN IF NOT EXISTS referred_by_id INTEGER;
`);
console.log("Added referral columns to users table");

await pool.query(`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'users_referral_code_unique'
    ) THEN
      ALTER TABLE users ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);
    END IF;
  END $$;
`);
console.log("Unique constraint on referral_code ensured");

await pool.query(`
  CREATE TABLE IF NOT EXISTS bonus_catalog (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward NUMERIC(18,6) NOT NULL,
    condition_value NUMERIC(18,6) NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);
console.log("bonus_catalog table ready");

await pool.query(`
  CREATE TABLE IF NOT EXISTS bonus_claim_logs (
    id SERIAL PRIMARY KEY,
    bonus_catalog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    gain NUMERIC(18,6) NOT NULL,
    claimed_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`);
console.log("bonus_claim_logs table ready");

await pool.end();
console.log("Migrations complete!");
process.exit(0);
