/*
  # Create tasks and user_tasks system

  1. New Tables
    - `tasks` - Available tasks for users to complete
      - `id` (uuid, primary key)
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `reward_amount` (numeric) - IDA tokens reward
      - `xp_reward` (integer) - XP points reward
      - `task_type` (text) - Type of task
      - `required_value` (text) - Required value for completion
      - `proof_required_type` (text) - Type of proof required
      - `is_active` (boolean) - Whether task is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_tasks` - User progress on tasks
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to users table
      - `task_id` (uuid) - Reference to tasks table
      - `status` (text) - Task status
      - `proof_url` (text) - URL proof of completion
      - `proof_text` (text) - Text proof of completion
      - `completed_at` (timestamp)
      - `claimed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Add admin policies for task management

  3. Sample Data
    - Insert sample tasks for testing
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_amount numeric NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 0,
  task_type text NOT NULL,
  required_value text,
  proof_required_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status text DEFAULT 'available' CHECK (status IN ('available', 'completed', 'claimed')),
  proof_url text,
  proof_text text,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Anyone can read active tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_admin = true
  ));

-- User tasks policies
CREATE POLICY "Users can read own tasks"
  ON user_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON user_tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert user tasks"
  ON user_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tasks_updated_at ON user_tasks;
CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tasks
INSERT INTO tasks (title, description, reward_amount, xp_reward, task_type, is_active) VALUES
  ('Connect Your Wallet', 'Connect your MultiversX wallet to get started', 100, 10, 'wallet_connect', true),
  ('Complete Your Profile', 'Fill out your profile information', 50, 5, 'profile_complete', true),
  ('Create Your First Gig', 'Create and publish your first service offering', 200, 20, 'gig_create', true),
  ('Make Your First Order', 'Place your first order on the platform', 150, 15, 'order_create', true),
  ('Reach Level 5', 'Reach level 5 in the rewards system', 500, 50, 'mining_level', true)
ON CONFLICT DO NOTHING;