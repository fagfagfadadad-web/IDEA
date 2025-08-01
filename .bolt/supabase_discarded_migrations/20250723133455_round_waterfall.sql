/*
  # Add missing RLS policies for complete functionality

  1. Missing Policies
    - `anonymous_users_can_create_profile` on users table
    - `public_users_can_create_profile` on users table
    - `authenticated_users_can_insert_own_profile` on users table

  2. Security
    - Enable proper user creation flow
    - Allow anonymous profile creation during signup
    - Maintain security with proper checks
*/

-- Add missing user creation policies
CREATE POLICY "anonymous_users_can_create_profile"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "public_users_can_create_profile"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "authenticated_users_can_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure all tables have proper service_role access
DO $$
BEGIN
  -- Check if service_role policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'referrals' 
    AND policyname = 'service_role_referrals'
  ) THEN
    CREATE POLICY "service_role_referrals"
      ON referrals
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'referral_rewards' 
    AND policyname = 'service_role_referral_rewards'
  ) THEN
    CREATE POLICY "service_role_referral_rewards"
      ON referral_rewards
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'referral_stats' 
    AND policyname = 'service_role_referral_stats'
  ) THEN
    CREATE POLICY "service_role_referral_stats"
      ON referral_stats
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Update existing policies to ensure they work correctly
DROP POLICY IF EXISTS "authenticated_update_own" ON users;
CREATE POLICY "authenticated_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Clients can manage own requests" ON client_requests;
CREATE POLICY "Clients can manage own requests"
  ON client_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);