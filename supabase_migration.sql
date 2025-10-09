/*
  # PupFi Multi-Auth System Migration

  1. New Tables
    - `profiles` - User profiles with multiple auth methods
      - `id` (uuid, primary key) - matches Supabase auth.users.id
      - `username` (text, unique) - display name
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `bio` (text, nullable)
      - `email` (text, nullable)
      - `wallet_address` (text, nullable, unique when not null)
      - `auth_method` (text) - 'google', 'wallet', 'guest'
      - `is_guest` (boolean, default false)
      - `is_admin` (boolean, default false)
      - `is_banned` (boolean, default false)
      - `is_chat_banned` (boolean, default false)
      - `chat_ban_until` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `game_stats` - User game statistics
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, foreign key to profiles.id)
      - `zen_balance` (integer, default 1000)
      - `game_tickets` (integer, default 5)
      - `last_daily_ticket_claim` (timestamptz, nullable)
      - `total_mined` (integer, default 0)
      - `mining_level` (integer, default 1)
      - `experience` (integer, default 0)
      - `referral_code` (text, unique)
      - `referred_by` (text, nullable)
      - `total_referrals` (integer, default 0)
      - `referral_earnings` (integer, default 0)
      - `active_boosts` (jsonb, default '[]')
      - `permanent_upgrades` (jsonb, default '{"autoFeeder": false, "happinessBooster": 1}')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `ships` - User's dogs/pets
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, foreign key to profiles.id)
      - `name` (text)
      - `level` (integer, default 1)
      - `mining_power` (integer)
      - `energy_capacity` (integer)
      - `current_energy` (integer)
      - `ship_type` (text)
      - `upgrades` (jsonb, default '{}')
      - `last_mining` (timestamptz, default now())
      - `created_at` (timestamptz, default now())

    - `tasks` - Available tasks
      - `id` (uuid, primary key, default gen_random_uuid())
      - `title` (text)
      - `description` (text)
      - `reward_amount` (integer)
      - `ticket_reward` (integer, default 0)
      - `task_type` (text)
      - `requirements` (jsonb, default '{}')
      - `reference_link` (text, nullable)
      - `banner_image` (text, nullable)
      - `requires_proof` (boolean, default false)
      - `proof_type` (text, default 'none')
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `user_tasks` - User task progress
      - `id` (uuid, primary key, default gen_random_uuid())
      - `task_id` (uuid, foreign key to tasks.id)
      - `user_id` (uuid, foreign key to profiles.id)
      - `status` (text, default 'not_started')
      - `progress` (integer, default 0)
      - `proof_url` (text, nullable)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())

    - `game_plays` - Track game plays for ticket system
      - `id` (uuid, primary key, default gen_random_uuid())
      - `user_id` (uuid, foreign key to profiles.id)
      - `game_id` (text)
      - `last_played` (timestamptz, default now())
      - `total_plays` (integer, default 0)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated and anonymous users
    - Users can only modify their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  email text DEFAULT '',
  wallet_address text,
  auth_method text DEFAULT 'guest',
  is_guest boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  is_chat_banned boolean DEFAULT false,
  chat_ban_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_wallet_address UNIQUE NULLS NOT DISTINCT (wallet_address)
);

-- Create game_stats table
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  zen_balance integer DEFAULT 1000,
  game_tickets integer DEFAULT 5,
  last_daily_ticket_claim timestamptz,
  total_mined integer DEFAULT 0,
  mining_level integer DEFAULT 1,
  experience integer DEFAULT 0,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  total_referrals integer DEFAULT 0,
  referral_earnings integer DEFAULT 0,
  active_boosts jsonb DEFAULT '[]'::jsonb,
  permanent_upgrades jsonb DEFAULT '{"autoFeeder": false, "happinessBooster": 1}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ships table
CREATE TABLE IF NOT EXISTS ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  level integer DEFAULT 1,
  mining_power integer NOT NULL,
  energy_capacity integer NOT NULL,
  current_energy integer NOT NULL,
  ship_type text NOT NULL,
  upgrades jsonb DEFAULT '{}'::jsonb,
  last_mining timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward_amount integer NOT NULL,
  ticket_reward integer DEFAULT 0,
  task_type text NOT NULL,
  requirements jsonb DEFAULT '{}'::jsonb,
  reference_link text,
  banner_image text,
  requires_proof boolean DEFAULT false,
  proof_type text DEFAULT 'none',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'not_started',
  progress integer DEFAULT 0,
  proof_url text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Create game_plays table
CREATE TABLE IF NOT EXISTS game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id text NOT NULL,
  last_played timestamptz DEFAULT now(),
  total_plays integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_referral_code ON game_stats(referral_code);
CREATE INDEX IF NOT EXISTS idx_ships_user_id ON ships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON game_plays(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Game stats policies
CREATE POLICY "Users can view own game stats"
  ON game_stats FOR SELECT
  TO authenticated, anon
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can update own game stats"
  ON game_stats FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own game stats"
  ON game_stats FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Ships policies
CREATE POLICY "Users can view own ships"
  ON ships FOR SELECT
  TO authenticated, anon
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own ships"
  ON ships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ships"
  ON ships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Anyone can view active tasks"
  ON tasks FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- User tasks policies
CREATE POLICY "Users can view own task progress"
  ON user_tasks FOR SELECT
  TO authenticated, anon
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own task progress"
  ON user_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own task progress"
  ON user_tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Game plays policies
CREATE POLICY "Users can view own game plays"
  ON game_plays FOR SELECT
  TO authenticated, anon
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own game plays"
  ON game_plays FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own game plays"
  ON game_plays FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'PUPFI' || upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM game_stats WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
