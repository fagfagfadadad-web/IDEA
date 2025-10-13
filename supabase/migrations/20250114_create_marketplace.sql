/*
  # Marketplace System

  1. New Tables
    - `marketplace_listings`
      - `id` (uuid, primary key)
      - `user_id` (text, seller ID)
      - `inventory_item_id` (uuid, reference to inventory_items)
      - `item_id` (text, shop item identifier)
      - `item_name` (text)
      - `item_type` (text)
      - `quantity` (integer, default 1)
      - `price` (integer, asking price in Food)
      - `effect` (jsonb)
      - `metadata` (jsonb)
      - `status` (text: 'active', 'sold', 'cancelled')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `marketplace_transactions`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, reference to marketplace_listings)
      - `seller_id` (text)
      - `buyer_id` (text)
      - `item_id` (text)
      - `item_name` (text)
      - `quantity` (integer)
      - `price` (integer)
      - `transaction_fee` (integer, marketplace fee)
      - `seller_earnings` (integer, price minus fee)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Sellers can create and manage their listings
    - Anyone can view active listings
    - Buyers can purchase listings
*/

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  inventory_item_id uuid,
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL,
  quantity integer DEFAULT 1,
  price integer NOT NULL,
  effect jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketplace_transactions table
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  seller_id text NOT NULL,
  buyer_id text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  price integer NOT NULL,
  transaction_fee integer DEFAULT 0,
  seller_earnings integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user_id ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_item_id ON marketplace_listings(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_seller ON marketplace_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_id);

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Marketplace Listings Policies
CREATE POLICY "Anyone can view active listings"
  ON marketplace_listings FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Users can create own listings"
  ON marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own listings"
  ON marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own listings"
  ON marketplace_listings FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Marketplace Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON marketplace_transactions FOR SELECT
  TO authenticated
  USING (auth.uid()::text = seller_id OR auth.uid()::text = buyer_id);

CREATE POLICY "System can insert transactions"
  ON marketplace_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();
