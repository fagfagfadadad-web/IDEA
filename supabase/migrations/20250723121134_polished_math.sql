/*
  # Fix Messages RLS Policies and Add Admin Functions

  1. Changes
    - Fix messages RLS policies to allow proper communication in orders
    - Add status field to gigs table
    - Add is_banned field to users table
    - Add admin RPC functions for user and gig management
    - Add new admin address
    - Create is_order_provider function for payment verification

  2. Security
    - Maintain proper access control for all operations
    - Only allow admins to perform administrative actions
    - Ensure providers can claim payments for their orders
*/

-- Drop existing policies for messages
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_service_role_policy" ON messages;
DROP POLICY IF EXISTS "Users can read messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Create new, more permissive policies for messages
CREATE POLICY "messages_select_policy" ON messages 
FOR SELECT TO authenticated 
USING (
  -- Sender can always view their own messages
  sender_id = auth.uid() OR 
  -- Client or provider can view messages for their orders
  EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN gigs g ON o.gig_id = g.id
    WHERE o.id = messages.order_id AND (
      -- Client of the order
      o.client_id = auth.uid() OR 
      -- Provider of the gig
      (g.id IS NOT NULL AND g.provider_id = auth.uid()) OR
      -- Provider of the proposal that created this order
      EXISTS (
        SELECT 1 FROM proposals p
        WHERE p.provider_id = auth.uid() 
        AND p.id::text = o.requirements->>'proposal_id'
      )
    )
  ) OR
  -- Direct chat participants
  seller_id = auth.uid()
);

CREATE POLICY "messages_insert_policy" ON messages 
FOR INSERT TO authenticated 
WITH CHECK (
  -- Sender must be the authenticated user
  sender_id = auth.uid() AND (
    -- Must be a participant in the order
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = order_id AND (
        -- Client of the order
        o.client_id = auth.uid() OR 
        -- Provider of the gig
        (g.id IS NOT NULL AND g.provider_id = auth.uid()) OR
        -- Provider of the proposal that created this order
        EXISTS (
          SELECT 1 FROM proposals p
          WHERE p.provider_id = auth.uid() 
          AND p.id::text = o.requirements->>'proposal_id'
        )
      )
    ) OR
    -- Direct chat participants
    seller_id = auth.uid()
  )
);

CREATE POLICY "messages_service_role_policy" ON messages 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create index for better performance when querying messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_order_created ON messages(order_id, created_at DESC);

-- Add status column to gigs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gigs' AND column_name = 'status'
  ) THEN
    ALTER TABLE gigs ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- Add check constraint to ensure valid status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'gigs_status_check'
  ) THEN
    ALTER TABLE gigs ADD CONSTRAINT gigs_status_check 
    CHECK (status IN ('active', 'paused', 'inactive'));
  END IF;
END $$;

-- Update existing gigs to have 'active' status
UPDATE gigs SET status = 'active' WHERE status IS NULL;

-- Make status column NOT NULL
ALTER TABLE gigs ALTER COLUMN status SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);

-- Add is_banned column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = true;

-- Create index for better performance when querying by proposal_id in requirements
CREATE INDEX IF NOT EXISTS idx_orders_requirements_proposal_id ON orders USING gin ((requirements->'proposal_id'));

-- Update notification functions to include email data
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  order_client_id UUID;
  order_provider_id UUID;
  recipient_id UUID;
  sender_username TEXT;
  gig_title TEXT;
  recipient_email TEXT;
  recipient_notifications_enabled BOOLEAN;
BEGIN
  -- Get order details
  SELECT o.client_id, g.provider_id, g.title
  INTO order_client_id, order_provider_id, gig_title
  FROM orders o
  LEFT JOIN gigs g ON o.gig_id = g.id
  WHERE o.id = NEW.order_id;
  
  -- If no gig, try to get provider from proposal
  IF order_provider_id IS NULL THEN
    SELECT p.provider_id INTO order_provider_id
    FROM proposals p
    JOIN orders o ON p.id::text = o.requirements->>'proposal_id'
    WHERE o.id = NEW.order_id;
  END IF;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM users 
  WHERE id = NEW.sender_id;
  
  -- Determine recipient (the other party in the conversation)
  IF NEW.sender_id = order_client_id THEN
    recipient_id := order_provider_id;
  ELSE
    recipient_id := order_client_id;
  END IF;
  
  -- Get recipient email and notification preferences
  SELECT email, email_notifications_enabled 
  INTO recipient_email, recipient_notifications_enabled
  FROM users
  WHERE id = recipient_id;
  
  -- Create notification for recipient with email data
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data,
    read,
    created_at
  ) VALUES (
    recipient_id,
    'message',
    'New Message',
    sender_username || ' sent you a message about "' || COALESCE(gig_title, 'your order') || '"',
    jsonb_build_object(
      'order_id', NEW.order_id,
      'sender_id', NEW.sender_id,
      'message_id', NEW.id,
      'recipient_email', recipient_email,
      'send_email', recipient_notifications_enabled,
      'sender_name', sender_username,
      'gig_title', COALESCE(gig_title, 'Order')
    ),
    false,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error in handle_new_message: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_order function to include email data for notifications
CREATE OR REPLACE FUNCTION handle_new_order()
RETURNS TRIGGER AS $$
DECLARE
  gig_title TEXT;
  provider_user_id UUID;
  client_username TEXT;
  provider_email TEXT;
  provider_notifications_enabled BOOLEAN;
BEGIN
  -- Get gig details if this is a gig-based order
  IF NEW.gig_id IS NOT NULL THEN
    SELECT g.title, g.provider_id, u.username
    INTO gig_title, provider_user_id, client_username
    FROM gigs g, users u
    WHERE g.id = NEW.gig_id AND u.id = NEW.client_id;
  ELSE
    -- This is a proposal-based order, get details from proposal
    SELECT p.provider_id, cr.title, u.username
    INTO provider_user_id, gig_title, client_username
    FROM proposals p
    JOIN client_requests cr ON p.request_id = cr.id
    JOIN users u ON u.id = NEW.client_id
    WHERE p.id::text = NEW.requirements->>'proposal_id';
  END IF;
  
  -- Get provider email and notification preferences
  SELECT email, email_notifications_enabled 
  INTO provider_email, provider_notifications_enabled
  FROM users
  WHERE id = provider_user_id;
  
  -- Create notification for provider with email data
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data,
    read,
    created_at
  ) VALUES (
    provider_user_id,
    'order_created',
    'New Order Received',
    client_username || ' placed an order for "' || COALESCE(gig_title, 'your service') || '"',
    jsonb_build_object(
      'order_id', NEW.id,
      'gig_id', NEW.gig_id,
      'client_id', NEW.client_id,
      'recipient_email', provider_email,
      'send_email', provider_notifications_enabled,
      'client_name', client_username,
      'gig_title', COALESCE(gig_title, 'Service')
    ),
    false,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error in handle_new_order: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the triggers
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_message();

DROP TRIGGER IF EXISTS on_new_order ON orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION handle_new_order();

-- Create function for admins to update users
CREATE OR REPLACE FUNCTION admin_update_user(
  user_id uuid,
  user_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_id uuid;
  is_admin boolean;
  updated_user jsonb;
BEGIN
  -- Get the ID of the calling user
  calling_user_id := auth.uid();
  
  -- Check if the calling user is an admin
  SELECT users.is_admin INTO is_admin
  FROM users
  WHERE users.id = calling_user_id;
  
  -- If not an admin, raise an exception
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only admins can update users';
  END IF;
  
  -- Update the user
  UPDATE users
  SET
    username = COALESCE(user_data->>'username', username),
    full_name = COALESCE(user_data->>'full_name', full_name),
    email = COALESCE(user_data->>'email', email),
    is_admin = COALESCE((user_data->>'is_admin')::boolean, is_admin),
    is_banned = COALESCE((user_data->>'is_banned')::boolean, is_banned)
  WHERE id = user_id;
  
  -- Get the updated user data
  SELECT jsonb_build_object(
    'id', id,
    'username', username,
    'full_name', full_name,
    'email', email,
    'is_admin', is_admin,
    'is_banned', is_banned
  ) INTO updated_user
  FROM users
  WHERE id = user_id;
  
  -- Return the updated user data
  RETURN updated_user;
END;
$$;

-- Create function for admins to delete gigs
CREATE OR REPLACE FUNCTION admin_delete_gig(
  gig_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_id uuid;
  is_admin boolean;
  gig_exists boolean;
BEGIN
  -- Get the ID of the calling user
  calling_user_id := auth.uid();
  
  -- Check if the calling user is an admin
  SELECT users.is_admin INTO is_admin
  FROM users
  WHERE users.id = calling_user_id;
  
  -- If not an admin, raise an exception
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only admins can delete gigs';
  END IF;
  
  -- Check if the gig exists
  SELECT EXISTS(SELECT 1 FROM gigs WHERE id = gig_id) INTO gig_exists;
  
  IF NOT gig_exists THEN
    RAISE EXCEPTION 'Gig not found: %', gig_id;
  END IF;
  
  -- Delete the gig
  DELETE FROM gigs
  WHERE id = gig_id;
  
  -- Return success
  RETURN true;
END;
$$;

-- Create function for admins to update gig status
CREATE OR REPLACE FUNCTION admin_update_gig_status(
  gig_id uuid,
  new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calling_user_id uuid;
  is_admin boolean;
  gig_exists boolean;
  updated_gig jsonb;
BEGIN
  -- Get the ID of the calling user
  calling_user_id := auth.uid();
  
  -- Check if the calling user is an admin
  SELECT users.is_admin INTO is_admin
  FROM users
  WHERE users.id = calling_user_id;
  
  -- If not an admin, raise an exception
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only admins can update gig status';
  END IF;
  
  -- Validate the status
  IF new_status NOT IN ('active', 'paused', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status: Status must be one of active, paused, or inactive';
  END IF;
  
  -- Check if the gig exists
  SELECT EXISTS(SELECT 1 FROM gigs WHERE id = gig_id) INTO gig_exists;
  
  IF NOT gig_exists THEN
    RAISE EXCEPTION 'Gig not found: %', gig_id;
  END IF;
  
  -- Update the gig status
  UPDATE gigs
  SET status = new_status
  WHERE id = gig_id;
  
  -- Get the updated gig data
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'status', status
  ) INTO updated_gig
  FROM gigs
  WHERE id = gig_id;
  
  -- Return the updated gig data
  RETURN updated_gig;
END;
$$;

-- Create a function to check if a user is a provider for an order
CREATE OR REPLACE FUNCTION is_order_provider(order_id uuid, user_address text)
RETURNS boolean AS $$
DECLARE
  is_provider boolean;
  provider_id uuid;
  proposal_id text;
BEGIN
  -- First check if the user is the provider by address
  SELECT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.id = order_id AND o.provider_address = user_address
  ) INTO is_provider;
  
  -- If not, check if this is a proposal-based order and the user is the provider of the proposal
  IF NOT is_provider THEN
    -- Get the proposal_id from the order requirements
    SELECT requirements->>'proposal_id' INTO proposal_id
    FROM orders
    WHERE id = order_id;
    
    IF proposal_id IS NOT NULL THEN
      -- Get the provider_id from the proposal
      SELECT p.provider_id INTO provider_id
      FROM proposals p
      WHERE p.id::text = proposal_id;
      
      -- Check if the provider has this wallet address
      IF provider_id IS NOT NULL THEN
        SELECT EXISTS (
          SELECT 1
          FROM users u
          WHERE u.id = provider_id AND u.wallet_address = user_address
        ) INTO is_provider;
      END IF;
    END IF;
  END IF;
  
  -- If still not found, check if this is a gig-based order
  IF NOT is_provider THEN
    -- Get the gig_id from the order
    DECLARE
      gig_id uuid;
    BEGIN
      SELECT o.gig_id INTO gig_id
      FROM orders o
      WHERE o.id = order_id;
      
      IF gig_id IS NOT NULL THEN
        -- Get the provider_id from the gig
        SELECT g.provider_id INTO provider_id
        FROM gigs g
        WHERE g.id = gig_id;
        
        -- Check if the provider has this wallet address
        IF provider_id IS NOT NULL THEN
          SELECT EXISTS (
            SELECT 1
            FROM users u
            WHERE u.id = provider_id AND u.wallet_address = user_address
          ) INTO is_provider;
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN COALESCE(is_provider, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a participant in an order
CREATE OR REPLACE FUNCTION is_order_participant(order_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_participant boolean;
BEGIN
  -- Check if the user is either the client or the provider of the order
  SELECT EXISTS (
    SELECT 1
    FROM orders o
    LEFT JOIN gigs g ON o.gig_id = g.id
    LEFT JOIN proposals p ON p.id::text = o.requirements->>'proposal_id'
    WHERE o.id = order_id AND (
      o.client_id = user_id OR 
      (g.id IS NOT NULL AND g.provider_id = user_id) OR
      (p.id IS NOT NULL AND p.provider_id = user_id)
    )
  ) INTO is_participant;
  
  RETURN COALESCE(is_participant, false);
EXCEPTION WHEN OTHERS THEN
  -- Log error but return false for safety
  RAISE WARNING 'Error in is_order_participant: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_gig TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_gig_status TO authenticated;
GRANT EXECUTE ON FUNCTION is_order_provider TO authenticated;
GRANT EXECUTE ON FUNCTION is_order_participant TO authenticated;

-- Add new admin address
INSERT INTO users (
  id,
  username,
  wallet_address,
  is_admin,
  email_notifications_enabled,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin_erd1rshkd5',
  'erd1rshkd53arjvs3gst2edpyxuhyfhvpz4ccaqff0qyp4km4uaz5lgqtlfggh',
  true,
  false,
  now()
) ON CONFLICT (wallet_address) 
DO UPDATE SET 
  is_admin = true,
  username = COALESCE(users.username, 'admin_erd1rshkd5');

-- Ensure index exists for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Verify admin address is configured
DO $$
DECLARE
  admin_count integer;
  admin_record record;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE is_admin = true;
  
  RAISE NOTICE '=== ADMIN CONFIGURATION COMPLETE ===';
  RAISE NOTICE 'Total admin users: %', admin_count;
  RAISE NOTICE 'Admin addresses configured:';
  
  -- Loop through admin users and display them
  FOR admin_record IN 
    SELECT wallet_address, username, created_at 
    FROM users 
    WHERE is_admin = true 
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'Admin: % (username: %, created: %)', 
      admin_record.wallet_address, 
      admin_record.username, 
      admin_record.created_at;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'All admin addresses can now:';
  RAISE NOTICE '- Access admin panel at /admin';
  RAISE NOTICE '- Resolve disputes via smart contract';
  RAISE NOTICE '- View platform statistics';
  RAISE NOTICE '- Manage user disputes';
  RAISE NOTICE '- Manage users (ban/unban)';
  RAISE NOTICE '- Manage gigs (delete/update status)';
  
  -- Verify the new admin address was added
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE wallet_address = 'erd1rshkd53arjvs3gst2edpyxuhyfhvpz4ccaqff0qyp4km4uaz5lgqtlfggh'
    AND is_admin = true
  ) THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS: New admin address erd1rshkd53arjvs3gst2edpyxuhyfhvpz4ccaqff0qyp4km4uaz5lgqtlfggh added successfully!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ WARNING: Failed to add new admin address';
  END IF;
END $$;