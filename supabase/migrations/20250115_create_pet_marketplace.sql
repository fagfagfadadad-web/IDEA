/*
  # Pet Marketplace System

  1. New Tables
    - `pet_market_listings`
      - `id` (uuid, primary key)
      - `pet_id` (text, reference to pet in Firebase)
      - `seller_id` (text, wallet address)
      - `seller_username` (text)
      - `breed_type` (text)
      - `pet_name` (text)
      - `level` (integer)
      - `evolution_stage` (text)
      - `is_shiny` (boolean)
      - `price` (integer, price in Food/Zen)
      - `pet_data` (jsonb, full pet object)
      - `status` (text: 'active', 'sold', 'cancelled')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pet_ownership_history`
      - `id` (uuid, primary key)
      - `pet_id` (text)
      - `from_user_id` (text, wallet address)
      - `from_username` (text)
      - `to_user_id` (text, wallet address)
      - `to_username` (text)
      - `transfer_type` (text: 'adoption', 'purchase', 'trade', 'gift')
      - `price` (integer, nullable)
      - `marketplace_listing_id` (uuid, nullable)
      - `transferred_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Sellers can create and manage their listings
    - Anyone can view active listings
    - All users can view ownership history
    - System can record transfers
*/

-- Create pet_market_listings table
CREATE TABLE IF NOT EXISTS pet_market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  seller_id text NOT NULL,
  seller_username text,
  breed_type text NOT NULL,
  pet_name text NOT NULL,
  level integer DEFAULT 1,
  evolution_stage text DEFAULT 'base',
  is_shiny boolean DEFAULT false,
  price integer NOT NULL,
  pet_data jsonb NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pet_ownership_history table
CREATE TABLE IF NOT EXISTS pet_ownership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id text NOT NULL,
  from_user_id text NOT NULL,
  from_username text,
  to_user_id text NOT NULL,
  to_username text,
  transfer_type text NOT NULL,
  price integer,
  marketplace_listing_id uuid,
  transferred_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pet_market_listings_seller ON pet_market_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_pet_market_listings_status ON pet_market_listings(status);
CREATE INDEX IF NOT EXISTS idx_pet_market_listings_breed ON pet_market_listings(breed_type, status, price);
CREATE INDEX IF NOT EXISTS idx_pet_market_listings_pet ON pet_market_listings(pet_id);

CREATE INDEX IF NOT EXISTS idx_pet_ownership_history_pet ON pet_ownership_history(pet_id, transferred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_ownership_history_from ON pet_ownership_history(from_user_id);
CREATE INDEX IF NOT EXISTS idx_pet_ownership_history_to ON pet_ownership_history(to_user_id);

-- Enable RLS
ALTER TABLE pet_market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_ownership_history ENABLE ROW LEVEL SECURITY;

-- Pet Market Listings Policies
CREATE POLICY "Anyone can view active pet listings"
  ON pet_market_listings FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can view own pet listings"
  ON pet_market_listings FOR SELECT
  TO authenticated
  USING (seller_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create pet listings"
  ON pet_market_listings FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own pet listings"
  ON pet_market_listings FOR UPDATE
  TO authenticated
  USING (seller_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (seller_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own pet listings"
  ON pet_market_listings FOR DELETE
  TO authenticated
  USING (seller_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Pet Ownership History Policies
CREATE POLICY "Anyone can view pet ownership history"
  ON pet_ownership_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert ownership records"
  ON pet_ownership_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pet_market_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pet_market_listings_updated_at
  BEFORE UPDATE ON pet_market_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_market_updated_at();
