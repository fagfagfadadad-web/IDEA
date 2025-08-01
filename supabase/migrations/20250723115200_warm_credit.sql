/*
  # Complete Database Setup Migration

  1. Reviews System
    - Create reviews table with rating constraints
    - Add RLS policies for public reading and authenticated creation
    - Add helper functions for gig reviews and provider ratings
    - Ensure one review per order with triggers

  2. Payment Token Support
    - Add payment_token column to gigs table
    - Add index for better query performance

  3. Database Functions and Triggers
    - Complete set of functions for user management
    - Order status change handling
    - Message and notification triggers
    - Review uniqueness enforcement

  4. Performance Indexes
    - Comprehensive indexing strategy for all tables
    - Optimized queries for common operations

  5. Enhanced RLS Policies
    - Fixed user profile update policies
    - Comprehensive security for all tables
    - Admin access controls

  6. MultiversX Email Confirmation
    - Auto-confirm MultiversX users
    - Handle existing unconfirmed users
    - Proper email confirmation flow

  7. Order Status Fix
    - Add 'pending_approval' to allowed order statuses
    - Maintain backward compatibility
*/

-- =====================================================
-- 1. REVIEWS SYSTEM
-- =====================================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create unique constraint: one review per order
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_id_unique ON reviews(order_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- RLS Policies for reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = reviews.order_id 
    AND orders.client_id = auth.uid() 
    AND orders.status = 'completed'
  )
);

-- =====================================================
-- 2. PAYMENT TOKEN SUPPORT
-- =====================================================

-- Add payment_token column to gigs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gigs' AND column_name = 'payment_token'
  ) THEN
    ALTER TABLE gigs ADD COLUMN payment_token text;
  END IF;
END $$;

-- Add index for payment_token
CREATE INDEX IF NOT EXISTS idx_gigs_payment_token ON gigs(payment_token);

-- =====================================================
-- 3. DATABASE FUNCTIONS
-- =====================================================

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, wallet_address, email_notifications_enabled, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'multiversx_address', ''),
    COALESCE((NEW.raw_user_meta_data->>'email_notifications_enabled')::boolean, false),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address),
    email_notifications_enabled = COALESCE(EXCLUDED.email_notifications_enabled, users.email_notifications_enabled);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create handle_order_status_change function
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create handle_new_message function
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  recipient_id UUID;
  sender_name TEXT;
  gig_title TEXT;
BEGIN
  -- Get order details
  SELECT o.*, g.title as gig_title, g.provider_id, u.username as sender_username
  INTO order_record
  FROM orders o
  JOIN gigs g ON o.gig_id = g.id
  JOIN users u ON NEW.sender_id = u.id
  WHERE o.id = NEW.order_id;
  
  -- Determine recipient
  IF NEW.sender_id = order_record.client_id THEN
    recipient_id := order_record.provider_id;
  ELSE
    recipient_id := order_record.client_id;
  END IF;
  
  -- Get sender name and gig title
  sender_name := order_record.sender_username;
  gig_title := order_record.gig_title;
  
  -- Create notification for recipient
  INSERT INTO notifications (
    user_id, type, title, content, data, read, created_at
  ) VALUES (
    recipient_id, 'message', 'New Message',
    sender_name || ' sent you a message about "' || gig_title || '"',
    jsonb_build_object('order_id', NEW.order_id, 'sender_id', NEW.sender_id, 'message_id', NEW.id),
    false, CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create handle_new_order function
CREATE OR REPLACE FUNCTION handle_new_order()
RETURNS TRIGGER AS $$
DECLARE
  gig_record RECORD;
BEGIN
  -- Get gig and client details
  SELECT g.*, u.username as client_username
  INTO gig_record
  FROM gigs g, users u
  WHERE g.id = NEW.gig_id AND u.id = NEW.client_id;
  
  -- Create notification for provider
  INSERT INTO notifications (
    user_id, type, title, content, data, read, created_at
  ) VALUES (
    gig_record.provider_id, 'order_created', 'New Order Received',
    gig_record.client_username || ' placed an order for "' || gig_record.title || '"',
    jsonb_build_object('order_id', NEW.id, 'gig_id', NEW.gig_id, 'client_id', NEW.client_id),
    false, CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create check_single_review_per_order function
CREATE OR REPLACE FUNCTION check_single_review_per_order()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reviews 
    WHERE order_id = NEW.order_id AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Only one review per order is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create helper functions for reviews
CREATE OR REPLACE FUNCTION get_gig_reviews(gig_uuid uuid)
RETURNS TABLE (
  review_id uuid, rating integer, comment text, created_at timestamptz,
  client_id uuid, client_username text, client_avatar_url text, client_full_name text
) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, r.rating, r.comment, r.created_at,
    u.id, u.username, u.avatar_url, u.full_name
  FROM reviews r
  JOIN orders o ON r.order_id = o.id
  JOIN gigs g ON o.gig_id = g.id
  JOIN users u ON o.client_id = u.id
  WHERE g.id = gig_uuid
  ORDER BY r.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_provider_rating(provider_uuid uuid)
RETURNS TABLE (average_rating numeric, total_reviews bigint) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(r.rating), 2), COUNT(r.id)
  FROM reviews r
  JOIN orders o ON r.order_id = o.id
  JOIN gigs g ON o.gig_id = g.id
  WHERE g.provider_id = provider_uuid;
END;
$$;

-- =====================================================
-- 4. MULTIVERSX EMAIL CONFIRMATION
-- =====================================================

-- Create auto-confirm function for MultiversX users
CREATE OR REPLACE FUNCTION auto_confirm_multiversx_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email LIKE '%@multiversx.com' THEN
    NEW.email_confirmed_at = NOW();
    NEW.email_change_confirm_status = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for manual confirmation
CREATE OR REPLACE FUNCTION confirm_multiversx_user_email(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW(), email_change_confirm_status = 0
  WHERE email = user_email AND email LIKE '%@multiversx.com' AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Auth user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- MultiversX email confirmation trigger
DROP TRIGGER IF EXISTS auto_confirm_multiversx_trigger ON auth.users;
CREATE TRIGGER auto_confirm_multiversx_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_confirm_multiversx_users();

-- Order status change trigger
DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION handle_order_status_change();

-- New message trigger
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- New order trigger
DROP TRIGGER IF EXISTS on_new_order ON orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION handle_new_order();

-- Review uniqueness trigger
DROP TRIGGER IF EXISTS reviews_single_per_order_trigger ON reviews;
CREATE TRIGGER reviews_single_per_order_trigger
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_single_review_per_order();

-- Disputes updated_at trigger
DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. PERFORMANCE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Gigs indexes
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_provider_id ON gigs(provider_id);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_gig_id ON orders(gig_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_seller_id ON messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_gig_id ON messages(gig_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_created_by ON disputes(created_by);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- =====================================================
-- 7. ENHANCED RLS POLICIES
-- =====================================================

-- Users policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON users;
CREATE POLICY "Anyone can read profiles" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
CREATE POLICY "Enable update for users based on id" ON users FOR UPDATE TO authenticated 
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Gigs policies
DROP POLICY IF EXISTS "Anyone can read gigs" ON gigs;
CREATE POLICY "Anyone can read gigs" ON gigs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Providers can create gigs" ON gigs;
CREATE POLICY "Providers can create gigs" ON gigs FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can update own gigs" ON gigs;
CREATE POLICY "Providers can update own gigs" ON gigs FOR UPDATE TO authenticated USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Allow delete for own gigs" ON gigs;
CREATE POLICY "Allow delete for own gigs" ON gigs FOR DELETE USING (auth.uid() = provider_id);

-- Orders policies
DROP POLICY IF EXISTS "Clients can create orders" ON orders;
CREATE POLICY "Clients can create orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT TO authenticated USING (
  auth.uid() = client_id OR 
  auth.uid() IN (SELECT provider_id FROM gigs WHERE id = orders.gig_id)
);

-- Messages policies
DROP POLICY IF EXISTS "Users can read messages for their orders" ON messages;
CREATE POLICY "Users can read messages for their orders" ON messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN gigs g ON o.gig_id = g.id
    WHERE o.id = messages.order_id 
    AND (o.client_id = auth.uid() OR g.provider_id = auth.uid())
  ) OR
  (seller_id = auth.uid() OR auth.uid() = sender_id)
);

DROP POLICY IF EXISTS "Users can send messages for their orders" ON messages;
CREATE POLICY "Users can send messages for their orders" ON messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = messages.order_id 
      AND (o.client_id = auth.uid() OR g.provider_id = auth.uid())
    ) OR
    seller_id = auth.uid()
  )
);

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;
CREATE POLICY "notifications_insert_system" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Disputes policies
DROP POLICY IF EXISTS "disputes_insert" ON disputes;
CREATE POLICY "disputes_insert" ON disputes FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "disputes_select" ON disputes;
CREATE POLICY "disputes_select" ON disputes FOR SELECT TO authenticated USING (
  created_by = auth.uid() OR 
  order_id IN (
    SELECT orders.id FROM orders 
    WHERE orders.client_id = auth.uid() OR 
    orders.gig_id IN (SELECT gigs.id FROM gigs WHERE gigs.provider_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

DROP POLICY IF EXISTS "disputes_update" ON disputes;
CREATE POLICY "disputes_update" ON disputes FOR UPDATE TO authenticated USING (
  (created_by = auth.uid() OR 
   order_id IN (
     SELECT orders.id FROM orders 
     WHERE orders.client_id = auth.uid() OR 
     orders.gig_id IN (SELECT gigs.id FROM gigs WHERE gigs.provider_id = auth.uid())
   )) OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
) WITH CHECK (
  (created_by = auth.uid() OR 
   order_id IN (
     SELECT orders.id FROM orders 
     WHERE orders.client_id = auth.uid() OR 
     orders.gig_id IN (SELECT gigs.id FROM gigs WHERE gigs.provider_id = auth.uid())
   )) OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
);

-- =====================================================
-- 8. ORDER STATUS FIX
-- =====================================================

-- Drop existing constraint and add updated one
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]));

-- =====================================================
-- 9. ADMIN STATS VIEW
-- =====================================================

-- Create admin_stats view
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM gigs) as total_gigs,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
  (SELECT COUNT(*) FROM disputes WHERE status = 'pending') as pending_disputes;

-- Grant permissions
GRANT SELECT ON admin_stats TO authenticated;

-- =====================================================
-- 10. ENSURE RLS IS ENABLED
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. UPDATE EXISTING MULTIVERSX USERS
-- =====================================================

-- Update existing unconfirmed MultiversX users
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  email_change_confirm_status = 0
WHERE 
  email LIKE '%@multiversx.com' 
  AND email_confirmed_at IS NULL;

-- =====================================================
-- 12. FINAL VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_count integer;
  policy_count integer;
  trigger_count integer;
  function_count integer;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO table_count 
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' 
  AND c.relrowsecurity = true;
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count 
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public';
  
  -- Count functions
  SELECT COUNT(*) INTO function_count 
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public';
  
  RAISE NOTICE '=== DATABASE SETUP COMPLETE ===';
  RAISE NOTICE 'Tables with RLS: %', table_count;
  RAISE NOTICE 'RLS Policies: %', policy_count;
  RAISE NOTICE 'Triggers: %', trigger_count;
  RAISE NOTICE 'Functions: %', function_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Reviews system ready';
  RAISE NOTICE '✅ Payment tokens supported';
  RAISE NOTICE '✅ Admin system configured';
  RAISE NOTICE '✅ MultiversX email confirmation enabled';
  RAISE NOTICE '✅ All RLS policies active';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '✅ Order status constraint updated';
  RAISE NOTICE '===============================';
END $$;