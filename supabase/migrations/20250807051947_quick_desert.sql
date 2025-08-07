/*
  # Add provider_id to reviews table

  1. Schema Changes
    - Add `provider_id` column to `reviews` table
    - Add foreign key constraint to `users` table
    - Add index for better query performance

  2. Data Migration
    - Populate existing reviews with correct provider_id based on order->gig->provider relationship
    - Handle both gig-based and proposal-based orders

  3. Security
    - Update RLS policies to use the new provider_id field
    - Ensure reviews are properly scoped to providers

  4. Automation
    - Add trigger to automatically set provider_id for new reviews
*/

-- Add provider_id column to reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN provider_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_provider_id_fkey'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_provider_id_fkey 
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_reviews_provider_id'
  ) THEN
    CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
  END IF;
END $$;

-- Migrate existing data: populate provider_id for existing reviews
UPDATE reviews 
SET provider_id = (
  SELECT COALESCE(
    -- For gig-based orders
    g.provider_id,
    -- For proposal-based orders, get provider from proposal
    (
      SELECT p.provider_id 
      FROM proposals p 
      WHERE p.id::text = (o.requirements ->> 'proposal_id')
      LIMIT 1
    )
  )
  FROM orders o
  LEFT JOIN gigs g ON o.gig_id = g.id
  WHERE o.id = reviews.order_id
)
WHERE provider_id IS NULL;

-- Create function to automatically set provider_id for new reviews
CREATE OR REPLACE FUNCTION set_review_provider_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get provider_id from the order
  SELECT COALESCE(
    -- For gig-based orders
    g.provider_id,
    -- For proposal-based orders
    (
      SELECT p.provider_id 
      FROM proposals p 
      WHERE p.id::text = (o.requirements ->> 'proposal_id')
      LIMIT 1
    )
  ) INTO NEW.provider_id
  FROM orders o
  LEFT JOIN gigs g ON o.gig_id = g.id
  WHERE o.id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set provider_id
DROP TRIGGER IF EXISTS set_review_provider_id_trigger ON reviews;
CREATE TRIGGER set_review_provider_id_trigger
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_provider_id();

-- Update RLS policies to use provider_id
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
CREATE POLICY "reviews_select_policy" ON reviews
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
CREATE POLICY "reviews_insert_policy" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = reviews.order_id 
      AND orders.client_id = auth.uid() 
      AND orders.status = 'completed'
    )
  );

-- Add policy for providers to read their own reviews
DROP POLICY IF EXISTS "providers_read_own_reviews" ON reviews;
CREATE POLICY "providers_read_own_reviews" ON reviews
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid());

-- Service role policy
DROP POLICY IF EXISTS "reviews_service_role_policy" ON reviews;
CREATE POLICY "reviews_service_role_policy" ON reviews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);