/*
  # Create disputes table with admin system

  1. Data Cleanup
    - Clear all notifications
    - Clear all reviews (depends on orders)
    - Clear all messages (depends on orders)
    - Clear all disputes (if exists)
    - Clear all orders

  2. New Tables
    - `disputes`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `created_by` (uuid, foreign key to users)
      - `reason` (text)
      - `status` (varchar, default 'pending')
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  3. Admin System
    - Add is_admin column to users table
    - Create admin-specific policies for disputes management

  4. Security
    - Enable RLS on disputes table
    - Users can insert their own disputes
    - Users can view disputes they created or are involved in
    - Admins can view and update all disputes

  5. Indexes
    - Add indexes for better query performance
*/

-- Clear all order-related data first
DELETE FROM notifications;
DELETE FROM reviews;
DELETE FROM messages;
DELETE FROM disputes;
DELETE FROM orders;

-- Clean up storage
DELETE FROM storage.objects WHERE bucket_id = 'chat-attachments';

-- Add is_admin column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

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

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "disputes_insert" ON disputes;
DROP POLICY IF EXISTS "disputes_select" ON disputes;
DROP POLICY IF EXISTS "disputes_update" ON disputes;

-- Create RLS policies for disputes
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
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_admin = true
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
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_admin = true
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
  ) OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);