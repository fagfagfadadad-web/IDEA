/*
  # Fix Rewards System Database Schema

  This migration creates all missing tables and fixes RLS policies for the rewards system.

  ## New Tables Created
  1. `tasks` - Main tasks table with reward information
  2. `user_tasks` - User progress tracking for tasks
  3. `transaction_history` - Transaction records for rewards

  ## Missing Columns Added
  - `users.ida_balance` - User's IDA token balance
  - `users.total_earned` - Total earnings across all activities
  - `users.level` - User level based on XP
  - `users.xp` - Experience points

  ## Security Policies
  - Fixed RLS policies for `referral_stats` to allow authenticated users to insert
  - Added proper RLS policies for all new tables
  - Ensured foreign key relationships are properly established

  ## Sample Data
  - Includes sample tasks for testing the system
*/

-- Add missing columns to users table
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
  updated_at timestamptz DEFAULT now()
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
  description text
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

-- RLS Policies for user_tasks table
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

-- RLS Policies for transaction_history table
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (
    to_address IN (
      SELECT wallet_address FROM users WHERE id = auth.uid()
    ) OR 
    from_address IN (
      SELECT wallet_address FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert transactions"
  ON transaction_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can manage transactions"
  ON transaction_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix RLS policies for referral_stats table
DROP POLICY IF EXISTS "Users can read own stats" ON referral_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON referral_stats;
DROP POLICY IF EXISTS "System can manage stats" ON referral_stats;
DROP POLICY IF EXISTS "Users can read all stats for leaderboard" ON referral_stats;

CREATE POLICY "Users can read own referral stats"
  ON referral_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read all referral stats for leaderboard"
  ON referral_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own referral stats"
  ON referral_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

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
CREATE INDEX IF NOT EXISTS idx_transaction_history_to_address ON transaction_history(to_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_from_address ON transaction_history(from_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tasks for testing
INSERT INTO tasks (title, description, reward_amount, xp_reward, task_type, required_value, proof_required_type, is_active) VALUES
('Connect Your Wallet', 'Connect your MultiversX wallet to get started', 100, 10, 'wallet_connect', NULL, 'none', true),
('Complete Your Profile', 'Fill out your profile information including bio and social links', 200, 20, 'profile_complete', NULL, 'none', true),
('Create Your First Gig', 'Create and publish your first service offering', 500, 50, 'gig_create', '1', 'none', true),
('Reach Level 5', 'Gain experience and reach level 5', 1000, 100, 'mining_level', '5', 'none', true),
('Join Our Discord', 'Join our Discord community and introduce yourself', 150, 15, 'social_join', 'discord', 'url', true),
('Follow on Twitter', 'Follow our official Twitter account', 100, 10, 'social_follow', 'twitter', 'url', true),
('Share on Social Media', 'Share IDEA Platform on your social media', 200, 20, 'social_share', NULL, 'url', true),
('Complete 5 Orders', 'Successfully complete 5 orders as a service provider', 2000, 200, 'order_complete', '5', 'none', true),
('Earn 1000 IDA', 'Accumulate 1000 IDA tokens through various activities', 500, 50, 'earnings_milestone', '1000', 'none', true),
('Refer 3 Friends', 'Invite 3 friends to join the platform using your referral link', 1500, 150, 'referral_count', '3', 'none', true)
ON CONFLICT (title) DO NOTHING;