/*
  # Inventory System

  1. New Tables
    - `inventory_items`
      - `id` (uuid, primary key)
      - `user_id` (text, foreign key to users)
      - `item_id` (text, shop item identifier)
      - `item_name` (text)
      - `item_type` (text: consumable, boost, special)
      - `quantity` (integer, default 1)
      - `purchased_at` (timestamptz)
      - `used_at` (timestamptz, nullable)
      - `is_used` (boolean, default false)
      - `effect` (jsonb, item effects)
      - `metadata` (jsonb, additional data)

    - `daily_deals`
      - `id` (uuid, primary key)
      - `item_id` (text, shop item identifier)
      - `original_price` (integer)
      - `discounted_price` (integer)
      - `discount_percentage` (integer)
      - `available_until` (timestamptz)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

    - `rare_items`
      - `id` (uuid, primary key)
      - `item_id` (text, unique identifier)
      - `name` (text)
      - `description` (text)
      - `price` (integer)
      - `rarity` (text: rare, epic, legendary)
      - `effect` (jsonb)
      - `emoji` (text)
      - `available_from` (timestamptz)
      - `available_until` (timestamptz, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own inventory
    - Add policies for daily deals (read-only for users)
    - Add policies for rare items (read-only for users)
*/

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL,
  quantity integer DEFAULT 1,
  purchased_at timestamptz DEFAULT now(),
  used_at timestamptz,
  is_used boolean DEFAULT false,
  effect jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create daily_deals table
CREATE TABLE IF NOT EXISTS daily_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL,
  original_price integer NOT NULL,
  discounted_price integer NOT NULL,
  discount_percentage integer NOT NULL,
  available_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create rare_items table
CREATE TABLE IF NOT EXISTS rare_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  rarity text NOT NULL,
  effect jsonb NOT NULL,
  emoji text NOT NULL,
  available_from timestamptz DEFAULT now(),
  available_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON inventory_items(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_is_used ON inventory_items(is_used);
CREATE INDEX IF NOT EXISTS idx_daily_deals_active ON daily_deals(is_active, available_until);
CREATE INDEX IF NOT EXISTS idx_rare_items_active ON rare_items(is_active);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rare_items ENABLE ROW LEVEL SECURITY;

-- Inventory Items Policies
CREATE POLICY "Users can view own inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own inventory"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own inventory"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own inventory"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Daily Deals Policies (read-only for users)
CREATE POLICY "Anyone can view active daily deals"
  ON daily_deals FOR SELECT
  TO authenticated
  USING (is_active = true AND available_until > now());

-- Rare Items Policies (read-only for users)
CREATE POLICY "Anyone can view active rare items"
  ON rare_items FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert some initial rare items
INSERT INTO rare_items (item_id, name, description, price, rarity, effect, emoji) VALUES
  ('legendary_xp_boost', 'Legendary XP Elixir', 'Instantly grants 10,000 XP to one pet', 3000, 'legendary', '{"xp": 10000}'::jsonb, '🌟'),
  ('epic_evolution_gem', 'Epic Evolution Gem', 'Instantly evolve any pet to next stage', 5000, 'epic', '{"instant_evolution": true}'::jsonb, '💎'),
  ('rare_shiny_token', 'Rare Shiny Token', 'Guaranteed shiny on next adoption', 4000, 'rare', '{"guaranteed_shiny": true}'::jsonb, '✨'),
  ('legendary_food_vault', 'Legendary Food Vault', 'Generate 500 Food per hour for 30 days', 10000, 'legendary', '{"food_per_hour": 500, "duration": 2592000}'::jsonb, '🏆'),
  ('epic_training_master', 'Epic Training Master', 'All training costs 0 for 7 days', 7500, 'epic', '{"free_training": true, "duration": 604800}'::jsonb, '🎓')
ON CONFLICT (item_id) DO NOTHING;
