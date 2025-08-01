/*
  # Initial schema setup for IDEA marketplace

  1. New Tables
    - users
      - id (uuid, primary key)
      - username (text, unique)
      - full_name (text)
      - avatar_url (text)
      - bio (text)
      - created_at (timestamp)
      
    - gigs
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - price (numeric)
      - duration (integer)
      - category (text)
      - provider_id (uuid, references users)
      - created_at (timestamp)
      
    - orders
      - id (uuid, primary key)
      - gig_id (uuid, references gigs)
      - client_id (uuid, references users)
      - status (text)
      - amount (numeric)
      - created_at (timestamp)
      
    - reviews
      - id (uuid, primary key)
      - order_id (uuid, references orders)
      - rating (integer)
      - comment (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Gigs table
CREATE TABLE IF NOT EXISTS gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  duration integer NOT NULL CHECK (duration > 0),
  category text NOT NULL,
  provider_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gigs"
  ON gigs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can create gigs"
  ON gigs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own gigs"
  ON gigs FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid REFERENCES gigs(id) NOT NULL,
  client_id uuid REFERENCES users(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  amount numeric NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() IN (
    SELECT provider_id FROM gigs WHERE id = gig_id
  ));

CREATE POLICY "Clients can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT client_id FROM orders WHERE id = order_id AND status = 'completed'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gigs_provider_id ON gigs(provider_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_gig_id ON orders(gig_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);