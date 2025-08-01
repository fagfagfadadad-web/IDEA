/*
  # Fix RLS policies for users and client_requests tables

  1. Security Updates
    - Fix users table UPDATE policy to use auth.uid()
    - Fix client_requests table INSERT policy to use auth.uid()
    - Ensure proper authentication checks

  2. Policy Changes
    - Drop existing problematic policies
    - Create new policies with correct auth.uid() usage
    - Enable proper access control
*/

-- Fix users table UPDATE policy
DROP POLICY IF EXISTS "authenticated_update_own" ON users;
CREATE POLICY "authenticated_update_own" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Fix client_requests table INSERT policy
DROP POLICY IF EXISTS "clients_manage_own_requests" ON client_requests;
CREATE POLICY "clients_manage_own_requests" 
  ON client_requests 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = client_id) 
  WITH CHECK (auth.uid() = client_id);

-- Ensure users can insert their own profile
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON users;
CREATE POLICY "authenticated_users_can_insert_own_profile" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);