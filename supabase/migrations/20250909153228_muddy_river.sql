/*
  # ZEN Mining Game Database Setup

  1. New Tables
    - `game_stats` - Player statistics and progress
    - `ships` - Player mining ships
    - `tasks` - Available tasks/missions
    - `user_tasks` - Player task progress
    - `referral_earnings` - Referral reward tracking

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Admin policies for task management

  3. Indexes
    - Performance indexes for common queries
    - Leaderboard optimization
*/

-- Game Stats Table
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zen_balance bigint DEFAULT 100,
  total_mined bigint DEFAULT 0,
  mining_level integer DEFAULT 1,
  experience bigint DEFAULT 0,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  total_referrals integer DEFAULT 0,
  referral_earnings bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Ships Table
CREATE TABLE IF NOT EXISTS ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  level integer DEFAULT 1,
  mining_power integer NOT NULL,
  energy_capacity integer NOT NULL,
  current_energy integer NOT NULL,
  ship_type text NOT NULL DEFAULT 'basic',
  upgrades jsonb DEFAULT '{}'::jsonb,
  last_mining timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_amount integer NOT NULL,
  task_type text NOT NULL DEFAULT 'mining',
  requirements jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Tasks Table (Progress tracking)
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Referral Earnings Table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  source text NOT NULL, -- 'mining', 'task_completion', etc.
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_stats
CREATE POLICY "Users can read own game stats" ON game_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own game stats" ON game_stats
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own game stats" ON game_stats
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can read leaderboard" ON game_stats
  FOR SELECT TO public
  USING (true);

-- RLS Policies for ships
CREATE POLICY "Users can manage own ships" ON ships
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Anyone can read active tasks" ON tasks
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- RLS Policies for user_tasks
CREATE POLICY "Users can manage own task progress" ON user_tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for referral_earnings
CREATE POLICY "Users can read own referral earnings" ON referral_earnings
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "System can create referral earnings" ON referral_earnings
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_zen_balance ON game_stats(zen_balance DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_total_mined ON game_stats(total_mined DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_mining_level ON game_stats(mining_level DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_referral_code ON game_stats(referral_code);
CREATE INDEX IF NOT EXISTS idx_game_stats_referred_by ON game_stats(referred_by);

CREATE INDEX IF NOT EXISTS idx_ships_user_id ON ships(user_id);
CREATE INDEX IF NOT EXISTS idx_ships_ship_type ON ships(ship_type);
CREATE INDEX IF NOT EXISTS idx_ships_last_mining ON ships(last_mining);

CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred ON referral_earnings(referred_id);

-- Functions for game mechanics
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update referrer's stats when someone they referred mines
  IF NEW.total_mined > OLD.total_mined THEN
    UPDATE game_stats 
    SET 
      referral_earnings = referral_earnings + ((NEW.total_mined - OLD.total_mined) * 0.1)::bigint,
      zen_balance = zen_balance + ((NEW.total_mined - OLD.total_mined) * 0.1)::bigint
    WHERE referral_code = NEW.referred_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for referral earnings
CREATE TRIGGER on_mining_update
  AFTER UPDATE OF total_mined ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_stats();

-- Function to handle ship energy regeneration
CREATE OR REPLACE FUNCTION regenerate_ship_energy()
RETURNS void AS $$
BEGIN
  UPDATE ships 
  SET current_energy = LEAST(
    energy_capacity, 
    current_energy + GREATEST(1, EXTRACT(EPOCH FROM (now() - last_mining)) / 300)::integer
  )
  WHERE current_energy < energy_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default tasks
INSERT INTO tasks (title, description, reward_amount, task_type, requirements, is_active) VALUES
('First Mining Operation', 'Complete your first mining operation with any ship', 50, 'mining', '{"mining_operations": 1}', true),
('Daily Miner', 'Mine ZEN tokens 5 times in a single day', 100, 'daily', '{"daily_mining_count": 5}', true),
('Ship Collector', 'Own 3 different ships in your fleet', 200, 'mining', '{"ship_count": 3}', true),
('Referral Master', 'Refer 5 new players to the game', 500, 'referral', '{"referral_count": 5}', true),
('Level Up', 'Reach mining level 5', 300, 'mining', '{"required_level": 5}', true),
('Energy Efficient', 'Complete 10 mining operations without running out of energy', 150, 'mining', '{"efficient_mining": 10}', true)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON game_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ships TO authenticated;
GRANT SELECT ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_tasks TO authenticated;
GRANT SELECT, INSERT ON referral_earnings TO authenticated;

GRANT ALL ON game_stats TO service_role;
GRANT ALL ON ships TO service_role;
GRANT ALL ON tasks TO service_role;
GRANT ALL ON user_tasks TO service_role;
GRANT ALL ON referral_earnings TO service_role;