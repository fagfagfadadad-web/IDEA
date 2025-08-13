/*
  # Create referral system tables

  1. New Tables
    - `referral_stats` - User referral statistics and codes
    - `referrals` - Individual referral relationships
    - `referral_rewards` - Rewards given for referrals
    - `transaction_history` - IDA token transaction history

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Allow users to manage their own referral data

  3. Indexes
    - Add performance indexes for common queries
*/

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
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
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
  reward_type text NOT NULL CHECK (reward_type IN ('signup_bonus', 'gig_creation', 'order_completion', 'monthly_bonus')),
  reward_amount numeric DEFAULT 0,
  reward_token text DEFAULT 'IDA',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  gig_id uuid REFERENCES gigs(id) ON DELETE SET NULL,
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

-- Enable RLS
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- Referral stats policies
CREATE POLICY "Users can read all referral stats"
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

-- Referrals policies
CREATE POLICY "Users can read own referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can insert referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Referral rewards policies
CREATE POLICY "Users can read own rewards"
  ON referral_rewards
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "System can manage rewards"
  ON referral_rewards
  FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Transaction history policies
CREATE POLICY "Users can read own transactions"
  ON transaction_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert transactions"
  ON transaction_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_stats_code ON referral_stats(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_transaction_history_to_address ON transaction_history(to_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_from_address ON transaction_history(from_address);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp DESC);