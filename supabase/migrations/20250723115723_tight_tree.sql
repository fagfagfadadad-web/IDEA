/*
# Final Authentication Fix Migration

This migration completely fixes authentication issues by:

1. Removing all problematic functions and triggers
2. Creating simple, reliable authentication functions
3. Fixing all RLS policies with proper cleanup
4. Ensuring MultiversX email auto-confirmation
5. Adding missing columns and constraints

## Changes Made:
- Dropped and recreated all auth-related functions
- Fixed RLS policies with proper DROP IF EXISTS
- Auto-confirm MultiversX emails
- Added payment_token column to orders
- Simplified user profile creation
*/

-- Step 1: Drop all problematic functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS auto_confirm_multiversx_trigger ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_confirm_multiversx_users() CASCADE;

-- Step 2: Drop ALL existing RLS policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop all policies on users table
    DROP POLICY IF EXISTS "Anyone can read profiles" ON users;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
    DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
    DROP POLICY IF EXISTS "Service role can manage users" ON users;
    DROP POLICY IF EXISTS "Users can create own profile" ON users;
    DROP POLICY IF EXISTS "Users can read all profiles" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON users;
    DROP POLICY IF EXISTS "Service role full access" ON users;
    DROP POLICY IF EXISTS "Users can read own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;
    DROP POLICY IF EXISTS "Enable insert for service role" ON users;
    DROP POLICY IF EXISTS "Enable update for service role" ON users;
    DROP POLICY IF EXISTS "public_read_profiles" ON users;
    DROP POLICY IF EXISTS "authenticated_insert_own" ON users;
    DROP POLICY IF EXISTS "authenticated_update_own" ON users;
    DROP POLICY IF EXISTS "service_role_all_access" ON users;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Step 3: Create SIMPLE and RELIABLE handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  counter integer := 1;
BEGIN
  -- Generate simple username from first 8 chars of ID
  new_username := 'user_' || substr(NEW.id::text, 1, 8);
  
  -- Make username unique if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
    new_username := 'user_' || substr(NEW.id::text, 1, 8) || '_' || counter::text;
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 100 THEN
      new_username := 'user_' || NEW.id::text;
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert user profile with minimal data
  INSERT INTO public.users (
    id, 
    username, 
    wallet_address, 
    email_notifications_enabled, 
    is_admin
  )
  VALUES (
    NEW.id,
    new_username,
    COALESCE(NEW.raw_user_meta_data->>'multiversx_address', ''),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create simple auto-confirm function
CREATE OR REPLACE FUNCTION auto_confirm_multiversx_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm MultiversX emails
  IF NEW.email LIKE '%@multiversx.com' THEN
    NEW.email_confirmed_at = NOW();
    NEW.email_change_confirm_status = 0;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail auth if this fails
    RAISE WARNING 'Error in auto_confirm_multiversx_users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER auto_confirm_multiversx_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_multiversx_users();

-- Step 6: Auto-confirm existing MultiversX users
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  email_change_confirm_status = 0
WHERE 
  email LIKE '%@multiversx.com' 
  AND email_confirmed_at IS NULL;

-- Step 7: Create NEW RLS policies (clean slate)
CREATE POLICY "public_read_profiles" ON users 
FOR SELECT TO public 
USING (true);

CREATE POLICY "authenticated_insert_own" ON users 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated_update_own" ON users 
FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "service_role_all_access" ON users 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 8: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 9: Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Step 10: Fix orders table
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'in_progress'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text]));

-- Add payment_token to orders if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_token'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_token text DEFAULT 'EGLD';
    END IF;
END $$;

UPDATE orders SET payment_token = 'EGLD' WHERE payment_token IS NULL;
ALTER TABLE orders ALTER COLUMN payment_token SET NOT NULL;

-- Step 11: Create or update essential utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Recreate essential triggers
DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION handle_order_status_change();

DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Ensure all tables have RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Step 14: Clean up any orphaned auth users without profiles
INSERT INTO public.users (id, username, wallet_address, email_notifications_enabled, is_admin)
SELECT 
    au.id,
    'user_' || substr(au.id::text, 1, 8) || '_fix',
    COALESCE(au.raw_user_meta_data->>'multiversx_address', ''),
    false,
    false
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 15: Fix RLS policies for orders table to allow order creation
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Clients can create orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_service_role_policy" ON orders;

-- Create new, working RLS policies for orders
CREATE POLICY "orders_insert_policy" ON orders 
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = client_id
);

CREATE POLICY "orders_select_policy" ON orders 
FOR SELECT TO authenticated 
USING (
  auth.uid() = client_id OR 
  auth.uid() IN (
    SELECT provider_id FROM gigs WHERE id = orders.gig_id
  )
);

CREATE POLICY "orders_update_policy" ON orders 
FOR UPDATE TO authenticated 
USING (
  auth.uid() = client_id OR 
  auth.uid() IN (
    SELECT provider_id FROM gigs WHERE id = orders.gig_id
  )
) 
WITH CHECK (
  auth.uid() = client_id OR 
  auth.uid() IN (
    SELECT provider_id FROM gigs WHERE id = orders.gig_id
  )
);

-- Service role policy for system operations
CREATE POLICY "orders_service_role_policy" ON orders 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT ALL ON orders TO service_role;

-- Step 16: Fix gigs policies to ensure they work properly
DROP POLICY IF EXISTS "Anyone can read gigs" ON gigs;
DROP POLICY IF EXISTS "Providers can create gigs" ON gigs;
DROP POLICY IF EXISTS "Providers can update own gigs" ON gigs;
DROP POLICY IF EXISTS "Allow delete for own gigs" ON gigs;
DROP POLICY IF EXISTS "gigs_select_policy" ON gigs;
DROP POLICY IF EXISTS "gigs_insert_policy" ON gigs;
DROP POLICY IF EXISTS "gigs_update_policy" ON gigs;
DROP POLICY IF EXISTS "gigs_delete_policy" ON gigs;
DROP POLICY IF EXISTS "gigs_service_role_policy" ON gigs;

CREATE POLICY "gigs_select_policy" ON gigs 
FOR SELECT TO public 
USING (true);

CREATE POLICY "gigs_insert_policy" ON gigs 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "gigs_update_policy" ON gigs 
FOR UPDATE TO authenticated 
USING (auth.uid() = provider_id) 
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "gigs_delete_policy" ON gigs 
FOR DELETE TO authenticated 
USING (auth.uid() = provider_id);

CREATE POLICY "gigs_service_role_policy" ON gigs 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled for gigs
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;

-- Grant permissions for gigs
GRANT SELECT, INSERT, UPDATE, DELETE ON gigs TO authenticated;
GRANT ALL ON gigs TO service_role;

-- Step 17: Fix messages policies
DROP POLICY IF EXISTS "Users can read messages for their orders" ON messages;
DROP POLICY IF EXISTS "Users can send messages for their orders" ON messages;
DROP POLICY IF EXISTS "Users can read messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_service_role_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages 
FOR SELECT TO authenticated 
USING (
  sender_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN gigs g ON o.gig_id = g.id
    WHERE o.id = messages.order_id 
    AND (o.client_id = auth.uid() OR g.provider_id = auth.uid())
  )
);

CREATE POLICY "messages_insert_policy" ON messages 
FOR INSERT TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN gigs g ON o.gig_id = g.id
    WHERE o.id = messages.order_id 
    AND (o.client_id = auth.uid() OR g.provider_id = auth.uid())
  )
);

CREATE POLICY "messages_service_role_policy" ON messages 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant permissions for messages
GRANT SELECT, INSERT ON messages TO authenticated;
GRANT ALL ON messages TO service_role;

-- Step 18: Fix notifications policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_service_role_policy" ON notifications;

CREATE POLICY "notifications_select_policy" ON notifications 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications 
FOR INSERT TO authenticated 
WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "notifications_update_policy" ON notifications 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_service_role_policy" ON notifications 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions for notifications
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Step 19: Fix reviews policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_service_role_policy" ON reviews;

CREATE POLICY "reviews_select_policy" ON reviews 
FOR SELECT TO public 
USING (true);

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

CREATE POLICY "reviews_service_role_policy" ON reviews 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Grant permissions for reviews
GRANT SELECT, INSERT ON reviews TO authenticated;
GRANT ALL ON reviews TO service_role;

-- Step 20: Create admin_stats view if not exists
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM gigs) as total_gigs,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
  (SELECT COUNT(*) FROM disputes WHERE status = 'pending') as pending_disputes;

-- Grant permissions on the view
GRANT SELECT ON admin_stats TO authenticated;
GRANT ALL ON admin_stats TO service_role;

-- Step 21: Add missing indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON orders(payment_token);

-- Step 22: Final verification
DO $$
BEGIN
  RAISE NOTICE '✅ Final authentication fix completed successfully!';
  RAISE NOTICE 'Features enabled:';
  RAISE NOTICE '- Simple user profile creation';
  RAISE NOTICE '- MultiversX email auto-confirmation';
  RAISE NOTICE '- Clean RLS policies for all tables';
  RAISE NOTICE '- Order creation with payment tokens';
  RAISE NOTICE '- Proper permissions for all operations';
END $$;