/*
  # Fix users table RLS policy for user creation

  1. Security Updates
    - Add policy to allow authenticated users to insert their own profile
    - Add policy to allow anonymous users to create profiles (for wallet connection)
    - Ensure proper RLS policies for user creation workflow

  2. Changes
    - Add INSERT policy for authenticated users
    - Add INSERT policy for anonymous users (needed for wallet connection)
    - Keep existing policies intact
*/

-- Allow authenticated users to insert their own profile
CREATE POLICY "authenticated_users_can_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow anonymous users to create profiles (needed for wallet connection)
CREATE POLICY "anonymous_users_can_create_profile"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public (anonymous) users to insert profiles for wallet connection
CREATE POLICY "public_users_can_create_profile"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);