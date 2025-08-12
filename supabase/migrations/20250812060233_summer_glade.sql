/*
  # Fix Rewards System Database Schema

  1. New Tables
    - `tasks` - System tasks that users can complete for rewards
      - `id` (uuid, primary key)
      - `title` (text, task name)
      - `description` (text, task description)
      - `reward_amount` (numeric, IDA tokens reward)
      - `xp_reward` (integer, experience points)
      - `task_type` (text, type of task)
      - `required_value` (text, optional requirement)
      - `proof_required_type` (text, type of proof needed)
      - `is_active` (boolean, whether task is available)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_tasks` - User progress on tasks
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `task_id` (uuid, foreign key to tasks)
      - `status` (text, completion status)
      - `proof_url` (text, optional proof file)
      - `proof_text` (text, optional proof text)
      - `completed_at` (timestamp)
      - `claimed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `transaction_history` - Track IDA token transactions
      - `id` (uuid, primary key)
      - `from_address` (text, sender address)
      - `to_address` (text, recipient address)
      - `token_identifier` (text, token type)
      - `amount` (numeric, transaction amount)
      - `transaction_hash` (text, blockchain hash)
      - `transaction_type` (text, type of transaction)
      - `status` (text, transaction status)
      - `timestamp` (timestamp)
      - `description` (text, optional description)

  2. User Table Updates
    - Add `ida_balance` (numeric, IDA token balance)
    - Add `total_earned` (numeric, total earnings)
    - Add `level` (integer, user level)
    - Add `xp` (integer, experience points)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Fix referral_stats RLS policy to allow inserts
    - Add service role policies for system operations

  4. Performance
    - Add indexes for frequently queried columns
    - Add foreign key constraints for data integrity
    - Add check constraints for data validation

  5. Sample Data
    - Insert sample tasks for testing the rewards system
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_amount numeric NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 0,
  task_type text NOT NULL DEFAULT 'manual',
  required_value text,
  proof_required_type text NOT NULL DEFAULT 'none',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints for tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_reward_amount_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_reward_amount_check CHECK (reward_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_xp_reward_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_xp_reward_check CHECK (xp_reward >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_task_type_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check 
    CHECK (task_type IN ('manual', 'wallet_connect', 'transaction', 'mining_level', 'referral', 'social_follow', 'social_post', 'social_retweet', 'social_like', 'external_link'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'tasks' AND constraint_name = 'tasks_proof_required_type_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_proof_required_type_check 
    CHECK (proof_required_type IN ('none', 'file', 'url', 'text'));
  END IF;
END $$;

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Anyone can read active tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can manage all tasks"
  ON tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
  updated_at timestamptz DEFAULT now()
);

-- Add check constraint for user_tasks status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_tasks' AND constraint_name = 'user_tasks_status_check'
  ) THEN
    ALTER TABLE user_tasks ADD CONSTRAINT user_tasks_status_check 
    CHECK (status IN ('available', 'in_progress', 'completed', 'claimed'));
  END IF;
END $$;

-- Add unique constraint to prevent duplicate user-task combinations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_tasks' AND constraint_name = 'user_tasks_user_task_unique'
  ) THEN
    ALTER TABLE user_tasks ADD CONSTRAINT user_tasks_user_task_unique UNIQUE (user_id, task_id);
  END IF;
END $$;

-- Enable RLS on user_tasks
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_tasks
CREATE POLICY "Users can manage own tasks"
  ON user_tasks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all user tasks"
  ON user_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
  description text
);

-- Add check constraints for transaction_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'transaction_history' AND constraint_name = 'transaction_history_amount_check'
  ) THEN
    ALTER TABLE transaction_history ADD CONSTRAINT transaction_history_amount_check CHECK (amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'transaction_history' AND constraint_name = 'transaction_history_type_check'
  ) THEN
    ALTER TABLE transaction_history ADD CONSTRAINT transaction_history_type_check 
    CHECK (transaction_type IN ('send', 'receive', 'reward', 'referral'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'transaction_history' AND constraint_name = 'transaction_history_status_check'
  ) THEN
    ALTER TABLE transaction_history ADD CONSTRAINT transaction_history_status_check 
    CHECK (status IN ('pending', 'success', 'failed'));
  END IF;
END $$;

-- Enable RLS on transaction_history
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transaction_history
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (from_address IN (
    SELECT wallet_address FROM users WHERE id = auth.uid()
  ) OR to_address IN (
    SELECT wallet_address FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage all transactions"
  ON transaction_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ida_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN ida_balance numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'total_earned'
  ) THEN
    ALTER TABLE users ADD COLUMN total_earned numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'level'
  ) THEN
    ALTER TABLE users ADD COLUMN level integer DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'xp'
  ) THEN
    ALTER TABLE users ADD COLUMN xp integer DEFAULT 0;
  END IF;
END $$;

-- Fix RLS policy for referral_stats to allow inserts
DROP POLICY IF EXISTS "Users can insert own stats" ON referral_stats;
CREATE POLICY "Users can insert own stats"
  ON referral_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_status ON user_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transaction_history_addresses ON transaction_history(from_address, to_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);

-- Create trigger function for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
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
INSERT INTO tasks (title, description, reward_amount, xp_reward, task_type, proof_required_type, is_active)
VALUES 
  ('Connect Your Wallet', 'Connect your MultiversX wallet to the platform', 1000, 50, 'wallet_connect', 'none', true),
  ('Complete Your Profile', 'Fill out your profile information including bio and skills', 500, 25, 'manual', 'none', true),
  ('Create Your First Gig', 'Create and publish your first service gig', 2000, 100, 'manual', 'none', true),
  ('Follow Us on Twitter', 'Follow @xIdeaMarket on Twitter/X', 250, 10, 'social_follow', 'url', true),
  ('Share About IDEA', 'Post about IDEA platform on social media', 500, 25, 'social_post', 'url', true),
  ('Reach Level 5', 'Accumulate enough XP to reach level 5', 1000, 0, 'mining_level', 'none', true),
  ('Complete First Order', 'Successfully complete your first order as a provider', 3000, 150, 'manual', 'none', true),
  ('Refer a Friend', 'Invite a friend to join the platform using your referral link', 1500, 75, 'referral', 'none', true)
ON CONFLICT (title) DO NOTHING;