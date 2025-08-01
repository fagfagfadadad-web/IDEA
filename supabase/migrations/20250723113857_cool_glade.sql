/*
  # Update users table RLS policies

  1. Changes
    - Ensures RLS is enabled on users table
    - Safely updates or creates the update policy for users
    - Ensures select policy exists

  2. Security
    - Users can update only their own profile
    - Users can read all profiles
    - Safe policy recreation with proper checks
*/

-- First ensure RLS is enabled (in case it wasn't)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Safely handle the update policy
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  
  -- Create the policy fresh
  CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
END $$;

-- Ensure the select policy exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read all profiles'
  ) THEN
    CREATE POLICY "Users can read all profiles"
    ON users
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;