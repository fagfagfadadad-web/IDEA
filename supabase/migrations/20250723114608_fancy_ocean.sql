/*
  # Clear all orders and related data

  1. Delete Operations
    - Clear all disputes related to orders
    - Clear all reviews related to orders  
    - Clear all messages related to orders
    - Clear all notifications related to orders
    - Clear all orders
    - Clean up chat attachments storage
  
  2. Security
    - Maintains RLS policies and table structures
    - Preserves user data and gigs
    - Only clears order-related data
    
  3. System Notification
    - Sends notification to all users about database clearing
*/

-- Delete data from child tables first to respect foreign key constraints
DELETE FROM disputes;
DELETE FROM reviews;
DELETE FROM messages;

-- Clear order-related notifications
DELETE FROM notifications 
WHERE type IN (
  'order_created', 
  'order_accepted', 
  'order_declined', 
  'order_delivered', 
  'payment_sent', 
  'payment_pending_release', 
  'payment_released', 
  'dispute_initiated', 
  'dispute_resolved',
  'price_offer', 
  'price_offer_accepted',
  'order_status',
  'message'
);

-- Finally, clear all orders
DELETE FROM orders;

-- Clean up chat attachments storage
DELETE FROM storage.objects WHERE bucket_id = 'chat-attachments';

-- Add system notification to inform users about the database clearing
INSERT INTO notifications (user_id, type, title, content, read, data, created_at)
SELECT 
  id as user_id,
  'system' as type,
  'Database Maintenance Completed' as title,
  'All orders and related data have been cleared from the system as part of maintenance. Your profile and gigs remain intact.' as content,
  false as read,
  jsonb_build_object('maintenance_type', 'order_cleanup') as data,
  now() as created_at
FROM users
WHERE EXISTS (SELECT 1 FROM gigs WHERE provider_id = users.id)
   OR id IN (SELECT DISTINCT provider_id FROM gigs);

-- Create disputes table if not exists (ensuring it exists after cleanup)
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  created_by uuid REFERENCES users(id),
  reason text,
  status varchar(20) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on disputes table
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "disputes_insert" ON disputes;
  DROP POLICY IF EXISTS "disputes_select" ON disputes;
  DROP POLICY IF EXISTS "disputes_update" ON disputes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add comprehensive RLS policies for disputes
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