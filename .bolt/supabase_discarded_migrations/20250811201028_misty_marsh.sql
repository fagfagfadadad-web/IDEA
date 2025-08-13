/*
  # Create Rewards System Tables

  1. New Tables
    - `tasks` - Available tasks for users to complete
    - `user_tasks` - User progress on tasks
    - `transaction_history` - Transaction records for rewards
    
  2. Missing Columns
    - Add `ida_balance`, `total_earned`, `level`, `xp` to users table
    
  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add service role policies for system operations
    
  4. Sample Data
    - Insert initial tasks for testing
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
  reward_amount numeric NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 0,
  task_type text NOT NULL,
  required_value text,
  proof_required_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tasks_reward_amount_check CHECK (reward_amount >= 0),
  CONSTRAINT tasks_xp_reward_check CHECK (xp_reward >= 0)
);

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'available',
  proof_url text,
  proof_text text,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_tasks_status_check CHECK (status IN ('available', 'completed', 'claimed')),
  UNIQUE(user_id, task_id)
);

-- Create transaction_history table
CREATE TABLE IF NOT EXISTS transaction_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address text NOT NULL,
  to_address text NOT NULL,
  token_identifier text NOT NULL,
  amount numeric NOT NULL,
  transaction_hash text,
  transaction_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  timestamp timestamptz DEFAULT now(),
  description text,
  CONSTRAINT transaction_history_amount_check CHECK (amount >= 0)
);

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks table
CREATE POLICY "Anyone can read active tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can manage tasks"
  ON tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_tasks table
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
  USING (true)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage user tasks"
  ON user_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for transaction_history table
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (from_address IN (SELECT wallet_address FROM users WHERE id = auth.uid()) 
         OR to_address IN (SELECT wallet_address FROM users WHERE id = auth.uid()));

CREATE POLICY "System can insert transactions"
  ON transaction_history
  FOR INSERT
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage transactions"
  ON transaction_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix referral_stats RLS policy
DROP POLICY IF EXISTS "Users can update own stats" ON referral_stats;
DROP POLICY IF EXISTS "System can manage stats" ON referral_stats;

CREATE POLICY "Users can insert own referral stats"
  ON referral_stats
  FOR INSERT
  TO authenticated
  USING (true)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own referral stats"
  ON referral_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own referral stats"
  ON referral_stats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage referral stats"
  ON referral_stats
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
CREATE INDEX IF NOT EXISTS idx_transaction_history_addresses ON transaction_history(from_address, to_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON transaction_history(transaction_type);

-- Create update trigger function if it doesn't exist
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

-- Insert sample tasks for testing
INSERT INTO tasks (title, description, reward_amount, xp_reward, task_type, required_value, proof_required_type, is_active)
VALUES 
  ('Connect Your Wallet', 'Connect your MultiversX wallet to get started', 100, 10, 'wallet_connect', NULL, NULL, true),
  ('Complete Your Profile', 'Fill out your profile information', 50, 5, 'profile_complete', NULL, NULL, true),
  ('Create Your First Gig', 'Create and publish your first service offering', 200, 20, 'gig_create', '1', NULL, true),
  ('Reach Level 5', 'Gain experience and reach level 5', 500, 50, 'mining_level', '5', NULL, true),
  ('Follow on Twitter', 'Follow our official Twitter account', 25, 5, 'social_follow', 'https://twitter.com/ideaplatform', 'url', true),
  ('Join Discord', 'Join our Discord community', 25, 5, 'social_join', 'https://discord.gg/ideaplatform', 'url', true)
ON CONFLICT (id) DO NOTHING;