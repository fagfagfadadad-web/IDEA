/*
  # Debug Admin Setup and Fix Notifications RLS

  1. Admin Setup
    - Debug current admin state
    - Add multiple admin addresses
    - Verify admin configuration
    
  2. Notifications Fix
    - Fix RLS policies for proper updates
    - Allow users to mark notifications as read
    - Ensure system can create notifications

  3. Security
    - Maintain proper access controls
    - Enable admin dispute management
*/

-- First, debug current admin state
DO $$
DECLARE
    total_users integer;
    admin_users integer;
    target_user_exists boolean;
    target_user_admin boolean;
    target_user_id uuid;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM users;
    
    -- Count admin users
    SELECT COUNT(*) INTO admin_users FROM users WHERE is_admin = true;
    
    -- Check if target user exists
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE wallet_address = 'erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t'
    ) INTO target_user_exists;
    
    -- Check if target user is admin
    SELECT COALESCE(is_admin, false) INTO target_user_admin
    FROM users 
    WHERE wallet_address = 'erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t';
    
    -- Get target user ID
    SELECT id INTO target_user_id
    FROM users 
    WHERE wallet_address = 'erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t';
    
    RAISE NOTICE '=== ADMIN DEBUG REPORT ===';
    RAISE NOTICE 'Total users in database: %', total_users;
    RAISE NOTICE 'Total admin users: %', admin_users;
    RAISE NOTICE 'Target wallet exists: %', target_user_exists;
    RAISE NOTICE 'Target user ID: %', COALESCE(target_user_id::text, 'NULL');
    RAISE NOTICE 'Target user is admin: %', target_user_admin;
    RAISE NOTICE '========================';
    
    -- If user exists, make them admin
    IF target_user_exists THEN
        UPDATE users 
        SET is_admin = true 
        WHERE wallet_address = 'erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t';
        
        RAISE NOTICE 'Admin privileges granted to wallet: erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t';
    ELSE
        RAISE NOTICE 'WARNING: Target wallet not found in database!';
        RAISE NOTICE 'User must log in first to create account.';
    END IF;
END $$;

-- Add additional admin addresses
INSERT INTO users (
  id,
  username,
  wallet_address,
  is_admin,
  email_notifications_enabled,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin_contract',
  'erd1qqqqqqqqqqqqqpgqvxhjtl0w0c6qzud9zz2kwartfymcfc3l6x7sxq0qay',
  true,
  false,
  now()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = true,
  username = COALESCE(users.username, 'admin_contract');

INSERT INTO users (
  id,
  username,
  wallet_address,
  is_admin,
  email_notifications_enabled,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin_erd1fwaklrx',
  'erd1fwaklrx7cykhkk2zquqng047e7j5wqygk0dz0s5xszx92mfmutcshwngek',
  true,
  false,
  now()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = true,
  username = COALESCE(users.username, 'admin_erd1fwaklrx');

INSERT INTO users (
  id,
  username,
  wallet_address,
  is_admin,
  email_notifications_enabled,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin_erd10gkh7e',
  'erd10gkh7efy2p783dtf0t5pq8prr3tdcgwzrf3turtwyk4323rw026s2k34yj',
  true,
  false,
  now()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = true,
  username = COALESCE(users.username, 'admin_erd10gkh7e');

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Update disputes policies for admin access
DROP POLICY IF EXISTS "disputes_select" ON disputes;
DROP POLICY IF EXISTS "disputes_update" ON disputes;

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

-- Fix notifications RLS policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow access to own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
DROP POLICY IF EXISTS "read_notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- Create new simplified and working policies for notifications
CREATE POLICY "notifications_select_own" 
  ON notifications FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" 
  ON notifications FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "notifications_update_own" 
  ON notifications FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Final verification
DO $$
DECLARE
  admin_count integer;
  admin_record record;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE is_admin = true;
  
  RAISE NOTICE '=== FINAL ADMIN CONFIGURATION ===';
  RAISE NOTICE 'Total admin users: %', admin_count;
  RAISE NOTICE 'Admin addresses configured:';
  
  FOR admin_record IN 
    SELECT wallet_address, username, created_at 
    FROM users 
    WHERE is_admin = true 
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Admin: % (username: %)', 
      admin_record.wallet_address, 
      admin_record.username;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Admin setup completed successfully!';
  RAISE NOTICE '✅ Notifications RLS policies fixed!';
  RAISE NOTICE 'Admins can now access /admin panel and resolve disputes';
END $$;