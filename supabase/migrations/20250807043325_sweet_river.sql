/*
  # Add provider_id to reviews table

  1. Schema Changes
    - Add `provider_id` column to `reviews` table to directly link reviews to providers
    - Add foreign key constraint to ensure data integrity
    - Add index for better query performance

  2. Data Migration
    - Populate existing reviews with correct provider_id based on order->gig->provider relationship

  3. Security
    - Update RLS policies to use the new provider_id field
    - Ensure reviews are properly scoped to providers
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

-- Populate provider_id for existing reviews
UPDATE reviews 
SET provider_id = (
  SELECT g.provider_id 
  FROM orders o 
  JOIN gigs g ON o.gig_id = g.id 
  WHERE o.id = reviews.order_id
)
WHERE provider_id IS NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_provider_id_fkey'
  ) THEN
    ALTER TABLE reviews 
    ADD CONSTRAINT reviews_provider_id_fkey 
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

-- Update RLS policies to use provider_id
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
CREATE POLICY "reviews_select_policy" ON reviews
  FOR SELECT USING (true);

-- Keep existing insert policy but ensure provider_id is set correctly
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
CREATE POLICY "reviews_insert_policy" ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = reviews.order_id 
      AND o.client_id = uid() 
      AND o.status = 'completed'
      AND g.provider_id = reviews.provider_id
    )
  );

-- Add trigger to automatically set provider_id when inserting reviews
CREATE OR REPLACE FUNCTION set_review_provider_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set provider_id based on the order's gig
  SELECT g.provider_id INTO NEW.provider_id
  FROM orders o
  JOIN gigs g ON o.gig_id = g.id
  WHERE o.id = NEW.order_id;
  
  IF NEW.provider_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine provider_id for review';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_review_provider_id_trigger ON reviews;
CREATE TRIGGER set_review_provider_id_trigger
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_provider_id();