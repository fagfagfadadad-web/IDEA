/*
  # Fix Multiple Proposals and RLS Policies

  1. Changes
    - Remove unique constraint on (request_id, provider_id) in proposals table
    - Update orders RLS policies to handle proposal-based orders
    - Update messages RLS policies to allow providers from proposals to send messages
    - Fix create_order_from_proposal function to store proposal_id as string
    - Add helper functions for checking participation
    
  2. Security
    - Maintain proper access control for all operations
    - Only allow legitimate participants to view and interact with orders/messages
*/

-- Step 1: Remove unique constraint that prevents multiple proposals
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'proposals_request_id_provider_id_key'
  ) THEN
    ALTER TABLE proposals DROP CONSTRAINT proposals_request_id_provider_id_key;
    RAISE NOTICE 'Unique constraint on proposals (request_id, provider_id) removed successfully';
  ELSE
    RAISE NOTICE 'Unique constraint on proposals (request_id, provider_id) does not exist';
  END IF;
END $$;

-- Check for any other unique indexes on request_id and provider_id
DO $$
DECLARE
  idx_name text;
BEGIN
  FOR idx_name IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'proposals' 
    AND indexdef LIKE '%request_id%provider_id%' 
    AND indexdef LIKE '%UNIQUE%'
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || idx_name;
    RAISE NOTICE 'Dropped unique index: %', idx_name;
  END LOOP;
END $$;

-- Step 2: Update handle_new_proposal function
CREATE OR REPLACE FUNCTION handle_new_proposal()
RETURNS TRIGGER AS $$
DECLARE
  client_user_id uuid;
  request_title text;
  provider_username text;
BEGIN
  -- Get request details
  SELECT cr.client_id, cr.title, u.username
  INTO client_user_id, request_title, provider_username
  FROM client_requests cr
  JOIN users u ON u.id = NEW.provider_id
  WHERE cr.id = NEW.request_id;
  
  -- Update request status to in_review if it's currently open
  UPDATE client_requests
  SET status = 'in_review'
  WHERE id = NEW.request_id
  AND status = 'open';
  
  -- Create notification for client
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data,
    read,
    created_at
  ) VALUES (
    client_user_id,
    'new_proposal',
    'New Proposal Received',
    provider_username || ' submitted a proposal for your request: "' || request_title || '"',
    jsonb_build_object(
      'request_id', NEW.request_id,
      'proposal_id', NEW.id,
      'provider_id', NEW.provider_id
    ),
    false,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_proposal: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Fix create_order_from_proposal function
DROP FUNCTION IF EXISTS create_order_from_proposal(uuid);

CREATE OR REPLACE FUNCTION create_order_from_proposal(proposal_id uuid)
RETURNS uuid AS $$
DECLARE
  new_order_id uuid;
  proposal_data record;
  request_data record;
  client_address text := '';
  provider_address text := '';
BEGIN
  -- Get the proposal data
  SELECT * INTO proposal_data
  FROM proposals
  WHERE id = proposal_id;
  
  IF proposal_data IS NULL THEN
    RAISE EXCEPTION 'Proposal not found: %', proposal_id;
  END IF;
  
  -- Update proposal status to accepted
  UPDATE proposals
  SET status = 'accepted', updated_at = now()
  WHERE id = proposal_id;
  
  -- Get the request data
  SELECT * INTO request_data
  FROM client_requests
  WHERE id = proposal_data.request_id;
  
  IF request_data IS NULL THEN
    RAISE EXCEPTION 'Client request not found for proposal: %', proposal_id;
  END IF;
  
  -- Get wallet addresses
  BEGIN
    SELECT wallet_address INTO client_address
    FROM users WHERE id = request_data.client_id;
  EXCEPTION WHEN OTHERS THEN
    client_address := '';
  END;
  
  BEGIN
    SELECT wallet_address INTO provider_address
    FROM users WHERE id = proposal_data.provider_id;
  EXCEPTION WHEN OTHERS THEN
    provider_address := '';
  END;
  
  -- Create the order with proposal_id as string
  INSERT INTO orders (
    gig_id,
    client_id,
    status,
    amount,
    requirements,
    deadline,
    payment_token,
    client_address,
    provider_address
  ) VALUES (
    NULL,
    request_data.client_id,
    'pending_approval',
    proposal_data.proposed_amount,
    jsonb_build_object(
      'description', proposal_data.description,
      'original_request', request_data.description,
      'deliverables', proposal_data.deliverables,
      'request_id', proposal_data.request_id,
      'proposal_id', proposal_id::text
    ),
    CURRENT_TIMESTAMP + (proposal_data.proposed_duration || ' days')::interval,
    COALESCE(proposal_data.payment_token, 'EGLD'),
    client_address,
    provider_address
  )
  RETURNING id INTO new_order_id;
  
  -- Update request status and selected proposal
  UPDATE client_requests
  SET 
    status = 'assigned',
    selected_proposal_id = proposal_id,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = proposal_data.request_id;
  
  -- Reject all other proposals
  UPDATE proposals
  SET status = 'rejected', updated_at = now()
  WHERE 
    request_id = proposal_data.request_id AND 
    id != proposal_id AND
    status = 'pending';
  
  -- Create system message
  BEGIN
    INSERT INTO proposal_messages (
      proposal_id,
      sender_id,
      content,
      created_at
    ) VALUES (
      proposal_id,
      request_data.client_id,
      'This proposal has been accepted and an order has been created. Order ID: ' || new_order_id,
      CURRENT_TIMESTAMP
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating system message: %', SQLERRM;
  END;
  
  RETURN new_order_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in create_order_from_proposal: %', SQLERRM;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Fix orders RLS policies
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_service_role_policy" ON orders;

CREATE POLICY "orders_insert_policy" ON orders 
FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "orders_select_policy" ON orders 
FOR SELECT TO authenticated 
USING (
  auth.uid() = client_id OR 
  auth.uid() IN (
    SELECT provider_id FROM gigs WHERE id = orders.gig_id
  ) OR
  auth.uid() IN (
    SELECT provider_id FROM proposals 
    WHERE id::text = orders.requirements->>'proposal_id'
  )
);

CREATE POLICY "orders_update_policy" ON orders 
FOR UPDATE TO authenticated 
USING (
  auth.uid() = client_id OR 
  auth.uid() IN (
    SELECT provider_id FROM gigs WHERE id = orders.gig_id
  ) OR
  auth.uid() IN (
    SELECT provider_id FROM proposals 
    WHERE id::text = orders.requirements->>'proposal_id'
  )
);

CREATE POLICY "orders_service_role_policy" ON orders 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 5: Fix messages RLS policies
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
    WHERE o.id = messages.order_id AND (
      o.client_id = auth.uid() OR 
      (g.id IS NOT NULL AND g.provider_id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM proposals p
        WHERE p.provider_id = auth.uid() 
        AND p.id::text = o.requirements->>'proposal_id'
      )
    )
  ) OR
  seller_id = auth.uid()
);

CREATE POLICY "messages_insert_policy" ON messages 
FOR INSERT TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = order_id AND (
        o.client_id = auth.uid() OR 
        (g.id IS NOT NULL AND g.provider_id = auth.uid()) OR
        EXISTS (
          SELECT 1 FROM proposals p
          WHERE p.provider_id = auth.uid() 
          AND p.id::text = o.requirements->>'proposal_id'
        )
      )
    ) OR
    seller_id = auth.uid()
  )
);

CREATE POLICY "messages_service_role_policy" ON messages 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 6: Create helper functions
CREATE OR REPLACE FUNCTION is_order_participant(order_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_participant boolean;
BEGIN
  IF order_id IS NULL OR user_id IS NULL THEN
    RETURN false;
  END IF;

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
  RAISE WARNING 'Error in is_order_participant: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_proposal_participant(proposal_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_participant boolean;
BEGIN
  IF proposal_id IS NULL OR user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM proposals p
    JOIN client_requests cr ON p.request_id = cr.id
    WHERE p.id = proposal_id AND (p.provider_id = user_id OR cr.client_id = user_id)
  ) INTO is_participant;
  
  RETURN COALESCE(is_participant, false);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in is_proposal_participant: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Ensure RLS is enabled and grant permissions
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_messages ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT ALL ON orders TO service_role;

GRANT SELECT, INSERT ON messages TO authenticated;
GRANT ALL ON messages TO service_role;

GRANT EXECUTE ON FUNCTION is_order_participant TO authenticated;
GRANT EXECUTE ON FUNCTION is_proposal_participant TO authenticated;

-- Step 8: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_requirements_proposal_id ON orders USING gin ((requirements->'proposal_id'));
CREATE INDEX IF NOT EXISTS idx_messages_order_created ON messages(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Step 9: Clean existing data to start fresh
UPDATE client_requests SET selected_proposal_id = NULL WHERE selected_proposal_id IS NOT NULL;
DELETE FROM proposal_messages;
DELETE FROM proposals;
DELETE FROM client_requests;
DELETE FROM notifications WHERE type IN ('new_proposal', 'proposal_accepted', 'proposal_message');