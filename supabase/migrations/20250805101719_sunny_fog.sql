/*
  # Add gig views tracking system

  1. New Tables
    - `gig_views`
      - `id` (uuid, primary key)
      - `gig_id` (uuid, foreign key to gigs)
      - `viewer_ip` (text, IP address of viewer)
      - `viewer_id` (uuid, optional foreign key to users for logged in users)
      - `user_agent` (text, browser/device info)
      - `created_at` (timestamp)

  2. New Columns
    - Add `view_count` to `gigs` table with default 0

  3. Security
    - Enable RLS on `gig_views` table
    - Add policies for reading views data
    - Add trigger to update view_count on gigs table

  4. Indexes
    - Add indexes for efficient querying of views data
*/

-- Add view_count column to gigs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gigs' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE gigs ADD COLUMN view_count integer DEFAULT 0;
  END IF;
END $$;

-- Create gig_views table
CREATE TABLE IF NOT EXISTS gig_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  viewer_ip text NOT NULL,
  viewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gig_views ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gig_views_gig_id ON gig_views(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_views_viewer_ip ON gig_views(viewer_ip);
CREATE INDEX IF NOT EXISTS idx_gig_views_viewer_id ON gig_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_gig_views_created_at ON gig_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gig_views_unique_view ON gig_views(gig_id, viewer_ip, viewer_id);

-- Add index for view_count on gigs table
CREATE INDEX IF NOT EXISTS idx_gigs_view_count ON gigs(view_count DESC);

-- RLS Policies
CREATE POLICY "Anyone can read gig views stats"
  ON gig_views
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can insert gig views"
  ON gig_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Function to update gig view count
CREATE OR REPLACE FUNCTION update_gig_view_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the view count in gigs table
  UPDATE gigs 
  SET view_count = (
    SELECT COUNT(*) 
    FROM gig_views 
    WHERE gig_id = NEW.gig_id
  )
  WHERE id = NEW.gig_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update view count
DROP TRIGGER IF EXISTS on_gig_view_added ON gig_views;
CREATE TRIGGER on_gig_view_added
  AFTER INSERT ON gig_views
  FOR EACH ROW
  EXECUTE FUNCTION update_gig_view_count();

-- Initialize view_count for existing gigs
UPDATE gigs 
SET view_count = 0 
WHERE view_count IS NULL;