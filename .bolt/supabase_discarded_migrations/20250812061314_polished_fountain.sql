/*
  # Fix Missing Tables and RLS Policies

  1. New Tables
    - `tasks` - System-wide task definitions for rewards
      - `id` (uuid, primary key)
      - `title` (text, task name)
      - `description` (text, task description)
      - `reward_amount` (numeric, IDA tokens reward)
      - `xp_reward` (integer, experience points)
      - `task_type` (text, type of task)
      - `required_value` (text, optional requirement)
      - `proof_required_type` (text, type of proof needed)
      - `is_active` (boolean, whether task is available)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `transaction_history` - User transaction records
      - `id` (uuid, primary key)
      - `from_address` (text, sender address)
      - `to_address` (text, recipient address)
      - `token_identifier` (text, token type)
      - `amount` (numeric, transaction amount)
      - `transaction_hash` (text, blockchain hash)
      - `transaction_type` (text, type of transaction)
      - `status` (text, transaction status)
      - `timestamp` (timestamptz)
      - `description` (text, optional description)

  2. Missing Columns in Existing Tables
    - Add `ida_balance`, `total_earned`, `level`, `xp` to `users` table if missing

  3. Security
    - Enable RLS on new tables
    - Fix RLS policies for `referral_stats` to allow inserts
    - Add proper policies for new tables

  4. Relationships
    - Create foreign key between `user_tasks` and `tasks`
    - Ensure proper indexing for performance

  5. Sample Data
    - Insert sample tasks for testing the rewards system
*/

-- Create tasks table if it doesn't exist
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

-- Create transaction_history table if it doesn't exist
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

-- Add foreign key constraint to user_tasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_tasks_task_id_fkey'
    AND table_name = 'user_tasks'
  ) THEN
    ALTER TABLE user_tasks ADD CONSTRAINT user_tasks_task_id_fkey 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks table
DROP POLICY IF EXISTS "Public can read active tasks" ON tasks;
CREATE POLICY "Public can read active tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage tasks" ON tasks;
CREATE POLICY "Service role can manage tasks"
  ON tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for transaction_history table
DROP POLICY IF EXISTS "Users can read own transactions" ON transaction_history;
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (
    from_address IN (
      SELECT wallet_address FROM users WHERE id = auth.uid()
    ) OR
    to_address IN (
      SELECT wallet_address FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage transactions" ON transaction_history;
CREATE POLICY "Service role can manage transactions"
  ON transaction_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert transactions" ON transaction_history;
CREATE POLICY "System can insert transactions"
  ON transaction_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix RLS policies for referral_stats to allow proper inserts
DROP POLICY IF EXISTS "Users can insert own referral stats" ON referral_stats;
CREATE POLICY "Users can insert own referral stats"
  ON referral_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own referral stats" ON referral_stats;
CREATE POLICY "Users can update own referral stats"
  ON referral_stats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_transaction_history_addresses ON transaction_history(from_address, to_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_history_type ON transaction_history(transaction_type);

-- Insert sample tasks for testing (only if tasks table is empty)
INSERT INTO tasks (title, description, reward_amount, xp_reward, task_type, proof_required_type, is_active)
SELECT * FROM (VALUES
  ('Connect Your Wallet', 'Connect your MultiversX wallet to the platform', 1000, 50, 'wallet_connect', 'none', true),
  ('Complete Your Profile', 'Fill out your profile information including bio and skills', 500, 25, 'manual', 'none', true),
  ('Create Your First Gig', 'Create and publish your first service offering', 2000, 100, 'manual', 'none', true),
  ('Follow Us on Twitter', 'Follow @xIdeaMarket on Twitter for updates', 250, 10, 'social_follow', 'url', true),
  ('Share on Social Media', 'Share IDEA platform on your social media', 300, 15, 'social_post', 'url', true),
  ('Reach Level 5', 'Accumulate enough XP to reach level 5', 1500, 75, 'mining_level', '5', true),
  ('Complete First Order', 'Successfully complete your first order as a provider', 3000, 150, 'manual', 'none', true),
  ('Refer a Friend', 'Invite a friend to join the platform using your referral link', 1000, 50, 'referral', 'none', true)
) AS v(title, description, reward_amount, xp_reward, task_type, proof_required_type, is_active)
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();