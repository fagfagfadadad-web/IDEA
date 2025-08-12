/*
  # Fix admin task management policy

  1. Security Updates
    - Add proper RLS policy for admin users to manage tasks
    - Ensure admins can create, update, and delete tasks
    - Fix existing policies that may be blocking admin operations

  2. Changes
    - Drop existing restrictive policies if they exist
    - Add comprehensive admin policies for task management
    - Ensure proper admin access to all task operations
*/

-- Drop existing policies that might be blocking admin operations
DROP POLICY IF EXISTS "tasks_admin_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Create comprehensive admin policies for tasks
CREATE POLICY "admins_can_manage_tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Allow public read access to active tasks
CREATE POLICY "public_can_read_active_tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (is_active = true);

-- Allow authenticated users to read all tasks (for their own task progress)
CREATE POLICY "authenticated_can_read_tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);