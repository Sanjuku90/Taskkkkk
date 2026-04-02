-- Auto-generate referral codes for existing users that don't have one yet
DO $$
DECLARE
  user_row RECORD;
  new_code VARCHAR(8);
  exists_check INTEGER;
BEGIN
  FOR user_row IN SELECT id FROM users WHERE referral_code IS NULL LOOP
    LOOP
      new_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      SELECT COUNT(*) INTO exists_check FROM users WHERE referral_code = new_code;
      EXIT WHEN exists_check = 0;
    END LOOP;
    UPDATE users SET referral_code = new_code WHERE id = user_row.id;
  END LOOP;
END $$;
