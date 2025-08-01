/*
  # Fix RLS policies, add wallet addresses and create disputes table

  1. Changes
    - Update RLS policies for public read access on gigs, users, and reviews
    - Add wallet_address column to users table
    - Add payment tracking columns to orders table
    - Add client_address and provider_address to orders
    - Create disputes table for order disputes

  2. Security
    - Enable public read access for gigs, users, and reviews
    - Add delete policy for gigs
    - Enable RLS on disputes table with proper policies

  3. Performance
    - Add indexes for wallet addresses and order lookups
    - Add unique constraint for wallet addresses
*/

-- Update RLS policies for gigs table to allow public read access
DROP POLICY IF EXISTS "Anyone can read gigs" ON gigs;

CREATE POLICY "Anyone can read gigs"
ON gigs FOR SELECT
USING (true);

-- Add delete policy for gigs
DROP POLICY IF EXISTS "Allow delete for own gigs" ON gigs;

CREATE POLICY "Allow delete for own gigs"
ON gigs FOR DELETE
USING (auth.uid() = provider_id);

-- Update RLS policies for users table to allow public read access
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Anyone can read profiles" ON users;

CREATE POLICY "Anyone can read profiles"
ON users FOR SELECT
USING (true);

-- Update RLS policies for reviews to allow public read access
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;

CREATE POLICY "Anyone can read reviews"
ON reviews FOR SELECT
USING (true);

-- Add wallet_address to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE users ADD COLUMN wallet_address text;
  END IF;
END $$;

-- Add payment tracking columns to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'transaction_hash'
  ) THEN
    ALTER TABLE orders ADD COLUMN transaction_hash varchar(64);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status varchar(20) DEFAULT 'pending';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'release_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN release_at timestamp without time zone;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'work_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN work_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'client_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN client_address text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'provider_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN provider_address text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_token'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_token text DEFAULT 'EGLD';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_gig_id ON orders(gig_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Add unique constraint for wallet addresses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_wallet_address_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Update existing orders to have proper addresses (this is a one-time fix)
UPDATE orders 
SET 
  client_address = COALESCE((SELECT wallet_address FROM users WHERE id = orders.client_id), ''),
  provider_address = COALESCE((
    SELECT u.wallet_address 
    FROM users u 
    JOIN gigs g ON u.id = g.provider_id 
    WHERE g.id = orders.gig_id
  ), '')
WHERE client_address = '' OR provider_address = '';

-- Create disputes table if not exists
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  created_by uuid REFERENCES users(id),
  reason text,
  status varchar(20) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Drop existing dispute policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "disputes_insert" ON disputes;
  DROP POLICY IF EXISTS "disputes_select" ON disputes;
  DROP POLICY IF EXISTS "disputes_update" ON disputes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add RLS policies for disputes
CREATE POLICY "disputes_insert"
ON disputes FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "disputes_select"
ON disputes FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR 
  order_id IN (
    SELECT orders.id FROM orders 
    WHERE orders.client_id = auth.uid() OR 
    orders.gig_id IN (
      SELECT gigs.id FROM gigs WHERE gigs.provider_id = auth.uid()
    )
  )
);

CREATE POLICY "disputes_update"
ON disputes FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR 
  order_id IN (
    SELECT orders.id FROM orders 
    WHERE orders.client_id = auth.uid() OR 
    orders.gig_id IN (
      SELECT gigs.id FROM gigs WHERE gigs.provider_id = auth.uid()
    )
  )
)
WITH CHECK (
  created_by = auth.uid() OR 
  order_id IN (
    SELECT orders.id FROM orders 
    WHERE orders.client_id = auth.uid() OR 
    orders.gig_id IN (
      SELECT gigs.id FROM gigs WHERE gigs.provider_id = auth.uid()
    )
  )
);