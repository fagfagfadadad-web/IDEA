/*
  # Create Rewards System Tables and Columns

  1. New Columns for Users Table
    - `ida_balance` (numeric) - User's IDA token balance for airdrop
    - `total_earned` (numeric) - Total IDA tokens earned by user
    - `level` (integer) - User's level in the rewards system
    - `xp` (integer) - User's experience points

  2. New Tables
    - `tasks` - Available tasks for users to complete
    - `user_tasks` - User-specific task progress and completion status
    - `referral_stats` - User referral statistics and codes
    - `referrals` - Individual referral relationships
    - `referral_rewards` - Rewards given for referrals
    - `transaction_history` - History of IDA token transactions

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Add new columns to users table
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
  task_type text NOT NULL DEFAULT 'manual',
  required_value text,
  proof_required_type text DEFAULT 'none',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status text DEFAULT 'available',
  proof_url text,
  proof_text text,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create referral_stats table
CREATE TABLE IF NOT EXISTS referral_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  total_referrals integer DEFAULT 0,
  active_referrals integer DEFAULT 0,
  total_referral_earnings numeric DEFAULT 0,
  pending_earnings numeric DEFAULT 0,
  completed_earnings numeric DEFAULT 0,
  total_rewards integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_user_id)
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE,
  reward_type text NOT NULL,
  reward_amount numeric DEFAULT 0,
  reward_token text DEFAULT 'IDA',
  status text DEFAULT 'pending',
  order_id uuid,
  gig_id uuid,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  transaction_hash text,
  notes text
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
  status text DEFAULT 'pending',
  timestamp timestamptz DEFAULT now(),
  description text
);

-- Enable RLS on all new tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Anyone can read active tasks"
  ON tasks
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Create policies for user_tasks table
CREATE POLICY "Users can manage own tasks"
  ON user_tasks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for referral_stats table
CREATE POLICY "Users can read own referral stats"
  ON referral_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

CREATE POLICY "Public can read referral stats for leaderboard"
  ON referral_stats
  FOR SELECT
  TO public
  USING (true);

-- Create policies for referrals table
CREATE POLICY "Users can read own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "System can manage referrals"
  ON referrals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for referral_rewards table
CREATE POLICY "Users can read own rewards"
  ON referral_rewards
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "System can manage rewards"
  ON referral_rewards
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for transaction_history table
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND (users.wallet_address = from_address OR users.wallet_address = to_address)
    )
  );

CREATE POLICY "System can manage transactions"
  ON transaction_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_from_address ON transaction_history(from_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_to_address ON transaction_history(to_address);

-- Create trigger function for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_user_tasks_updated_at
      BEFORE UPDATE ON user_tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_referrals_updated_at'
  ) THEN
    CREATE TRIGGER update_referrals_updated_at
      BEFORE UPDATE ON referrals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;