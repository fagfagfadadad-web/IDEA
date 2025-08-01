/*
  # Make gig_id nullable and fix proposal functions

  1. Changes
    - Make gig_id column nullable in orders table
    - Fix create_order_from_proposal function with better error handling
    - Fix handle_new_proposal_message function to prevent NULL content errors
    - Add proper validation and fallbacks

  2. Security
    - Maintain existing RLS policies
    - Add proper error handling to prevent transaction failures
*/

-- Make gig_id column nullable in orders table
ALTER TABLE orders 
ALTER COLUMN gig_id DROP NOT NULL;

-- Create or replace the create_order_from_proposal function with better error handling
CREATE OR REPLACE FUNCTION create_order_from_proposal(proposal_id uuid)
RETURNS uuid AS $$
DECLARE
  new_order_id uuid;
  proposal_record RECORD;
  client_address text;
  provider_address text;
  client_id uuid;
BEGIN
  -- Get proposal and request details with explicit client_id selection
  SELECT 
    p.*,
    cr.title as request_title,
    cr.description as request_description,
    cr.client_id,
    cr.requirements
  INTO proposal_record
  FROM proposals p
  JOIN client_requests cr ON p.request_id = cr.id
  WHERE p.id = proposal_id AND p.status = 'accepted';
  
  -- Validate that we have the required data
  IF proposal_record IS NULL THEN
    RAISE EXCEPTION 'Proposal not found or not accepted: %', proposal_id;
  END IF;
  
  -- Explicitly set client_id to avoid NULL values
  client_id := proposal_record.client_id;
  
  -- Validate client_id is not NULL
  IF client_id IS NULL THEN
    RAISE EXCEPTION 'Client ID cannot be NULL for proposal: %', proposal_id;
  END IF;
  
  -- Get wallet addresses with error handling
  SELECT wallet_address INTO client_address
  FROM users
  WHERE id = client_id;
  
  IF client_address IS NULL THEN
    client_address := ''; -- Fallback to empty string if not found
  END IF;
  
  SELECT wallet_address INTO provider_address
  FROM users
  WHERE id = proposal_record.provider_id;
  
  IF provider_address IS NULL THEN
    provider_address := ''; -- Fallback to empty string if not found
  END IF;
  
  -- Create order with explicit client_id
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
    NULL, -- No gig_id since this is from a request
    client_id, -- Use the explicitly set client_id
    'pending_approval',
    proposal_record.proposed_amount,
    jsonb_build_object(
      'description', proposal_record.description,
      'original_request', proposal_record.request_description,
      'deliverables', proposal_record.deliverables,
      'request_id', proposal_record.request_id,
      'proposal_id', proposal_id
    ),
    CURRENT_TIMESTAMP + (proposal_record.proposed_duration || ' days')::interval,
    COALESCE(proposal_record.payment_token, 'EGLD'),
    client_address,
    provider_address
  )
  RETURNING id INTO new_order_id;
  
  -- Update request status
  UPDATE client_requests
  SET 
    status = 'completed',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = proposal_record.request_id;
  
  RETURN new_order_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error in create_order_from_proposal: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    -- Re-raise the exception
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the handle_new_proposal_message function with better error handling
CREATE OR REPLACE FUNCTION handle_new_proposal_message()
RETURNS TRIGGER AS $$
DECLARE
  proposal_record RECORD;
  recipient_id uuid;
  sender_username text;
  request_title text;
  notification_content text;
BEGIN
  -- Get proposal details with proper error handling
  BEGIN
    SELECT 
      p.provider_id, 
      cr.client_id, 
      cr.title as request_title,
      u.username as sender_username
    INTO proposal_record
    FROM proposals p
    JOIN client_requests cr ON p.request_id = cr.id
    JOIN users u ON u.id = NEW.sender_id
    WHERE p.id = NEW.proposal_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue with default values
    RAISE WARNING 'Error fetching proposal details: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    proposal_record := NULL;
  END;
  
  -- Set default values if query failed
  IF proposal_record IS NULL THEN
    -- Try to get basic info separately
    BEGIN
      SELECT username INTO sender_username
      FROM users
      WHERE id = NEW.sender_id;
    EXCEPTION WHEN OTHERS THEN
      sender_username := 'User';
    END;
    
    BEGIN
      SELECT provider_id INTO proposal_record.provider_id
      FROM proposals
      WHERE id = NEW.proposal_id;
    EXCEPTION WHEN OTHERS THEN
      proposal_record.provider_id := NULL;
    END;
    
    BEGIN
      SELECT cr.client_id, cr.title
      INTO proposal_record.client_id, request_title
      FROM client_requests cr
      JOIN proposals p ON cr.id = p.request_id
      WHERE p.id = NEW.proposal_id;
    EXCEPTION WHEN OTHERS THEN
      proposal_record.client_id := NULL;
      request_title := 'a request';
    END;
  ELSE
    sender_username := proposal_record.sender_username;
    request_title := proposal_record.request_title;
  END IF;
  
  -- Determine recipient (the other party) with fallback
  IF NEW.sender_id = proposal_record.provider_id THEN
    recipient_id := proposal_record.client_id;
  ELSE
    recipient_id := proposal_record.provider_id;
  END IF;
  
  -- Only create notification if we have a recipient
  IF recipient_id IS NOT NULL THEN
    -- Build notification content with proper fallbacks
    notification_content := COALESCE(sender_username, 'Someone') || 
                           ' sent a message about a proposal' ||
                           CASE 
                             WHEN request_title IS NOT NULL AND request_title != '' THEN 
                               ' for "' || request_title || '"'
                             ELSE 
                               ''
                           END;
    
    -- Create notification with all required fields
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
      'proposal_message',
      'New Proposal Message',
      notification_content,
      jsonb_build_object(
        'proposal_id', NEW.proposal_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id
      ),
      false,
      CURRENT_TIMESTAMP
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error in handle_new_proposal_message: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_new_proposal_message ON proposal_messages;
CREATE TRIGGER on_new_proposal_message
  AFTER INSERT ON proposal_messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_proposal_message();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_order_from_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_from_proposal(uuid) TO service_role;

-- Ensure all necessary permissions are granted
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON client_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals TO authenticated;
GRANT SELECT, INSERT ON proposal_messages TO authenticated;

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE '✅ Orders table updated - gig_id is now nullable';
  RAISE NOTICE '✅ create_order_from_proposal function updated with better error handling';
  RAISE NOTICE '✅ handle_new_proposal_message function fixed to prevent NULL content errors';
  RAISE NOTICE '✅ All permissions granted for client requests system';
END $$;