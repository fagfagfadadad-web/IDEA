/*
  # Create tasks and user_tasks tables

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, required)
      - `reward_amount` (numeric, required)
      - `xp_reward` (numeric, default 0)
      - `task_type` (text, required)
      - `required_value` (text, optional)
      - `proof_required_type` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `task_id` (uuid, foreign key to tasks)
      - `status` (text, default 'available')
      - `proof_url` (text, optional)
      - `proof_text` (text, optional)
      - `completed_at` (timestamptz, optional)
      - `claimed_at` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `transaction_history`
      - `id` (uuid, primary key)
      - `from_address` (text, required)
      - `to_address` (text, required)
      - `token_identifier` (text, required)
      - `amount` (numeric, required)
      - `transaction_hash` (text, optional)
      - `transaction_type` (text, required)
      - `status` (text, default 'success')
      - `timestamp` (timestamptz, default now)
      - `description` (text, optional)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate

  3. Changes
    - Add missing columns to users table if they don't exist
    - Create indexes for performance
    - Add sample tasks for testing
*/

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ida_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN ida_balance numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'total_earned'
  ) THEN
    ALTER TABLE users ADD COLUMN total_earned numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'level'
  ) THEN
    ALTER TABLE users ADD COLUMN level integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'xp'
  ) THEN
    ALTER TABLE users ADD COLUMN xp integer DEFAULT 0;
  END IF;
END $$;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_amount numeric NOT NULL CHECK (reward_amount >= 0),
  xp_reward numeric DEFAULT 0 NOT NULL CHECK (xp_reward >= 0),
  task_type text NOT NULL CHECK (task_type IN (
    'manual', 'wallet_connect', 'transaction', 'mining_level', 
    'referral', 'social_follow', 'social_post', 'social_retweet', 
    'social_like', 'external_link'
  )),
  required_value text,
  proof_required_type text DEFAULT 'none' CHECK (proof_required_type IN ('none', 'file', 'url', 'text')),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status text DEFAULT 'available' NOT NULL CHECK (status IN ('available', 'completed', 'claimed')),
  proof_url text,
  proof_text text,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create transaction_history table
CREATE TABLE IF NOT EXISTS transaction_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address text NOT NULL,
  to_address text NOT NULL,
  token_identifier text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  transaction_hash text,
  transaction_type text NOT NULL CHECK (transaction_type IN ('reward', 'payment', 'refund', 'bonus')),
  status text DEFAULT 'success' NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  timestamp timestamptz DEFAULT now(),
  description text
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Anyone can read active tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can read all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage tasks"
  ON tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_tasks
CREATE POLICY "Users can read own tasks"
  ON user_tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks"
  ON user_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON user_tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage user tasks"
  ON user_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for transaction_history
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (to_address IN (
    SELECT wallet_address FROM users WHERE id = auth.uid()
  ) OR from_address IN (
    SELECT wallet_address FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage transactions"
  ON transaction_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_status ON user_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transaction_history_addresses ON transaction_history(to_address, from_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tasks for testing
INSERT INTO tasks (title, description, reward_amount, xp_reward, task_type, proof_required_type) VALUES
  ('Connect Your Wallet', 'Connect your MultiversX wallet to get started', 1000, 50, 'wallet_connect', 'none'),
  ('Complete Your Profile', 'Fill out your profile information', 500, 25, 'manual', 'none'),
  ('Follow Us on Twitter', 'Follow our official Twitter account', 250, 10, 'social_follow', 'url'),
  ('Share About IDEA', 'Post about IDEA on social media', 750, 30, 'social_post', 'url'),
  ('Reach Level 5', 'Reach mining level 5', 2000, 100, 'mining_level', 'none')
ON CONFLICT DO NOTHING;