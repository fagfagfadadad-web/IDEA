/*
  # Fix RLS policies for users and client_requests tables

  1. Users table policies
    - Fix authenticated_update_own policy to use auth.uid()
    - Ensure users can update their own profiles

  2. Client_requests table policies  
    - Fix clients_manage_own_requests policy to use auth.uid()
    - Ensure authenticated users can create requests

  3. Security
    - All policies use proper auth.uid() function
    - Maintain data isolation between users
*/

-- Fix users table RLS policies
DROP POLICY IF EXISTS "authenticated_update_own" ON users;
CREATE POLICY "authenticated_update_own" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Ensure users can insert their own profile
DROP POLICY IF EXISTS "authenticated_insert_own" ON users;
CREATE POLICY "authenticated_insert_own" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Fix client_requests table RLS policies
DROP POLICY IF EXISTS "clients_manage_own_requests" ON client_requests;
CREATE POLICY "clients_manage_own_requests" 
  ON client_requests 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = client_id) 
  WITH CHECK (auth.uid() = client_id);