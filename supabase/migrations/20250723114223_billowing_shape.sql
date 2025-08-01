/*
  # Add email notification preferences and update notification triggers

  1. Changes
    - Add email_notifications_enabled column to users table
    - Update handle_new_message function to include email data
    - Add handle_new_order function for order notifications
    - Add deadline and status_updated_at fields to orders table
    - Create function to handle order status changes
    - Create trigger for order status notifications

  2. Security
    - All functions use SECURITY DEFINER for proper permissions
    - Email data included for notification processing
    - Status change tracking with automatic deadline setting

  3. Features
    - Email notification preferences per user
    - Automatic deadline calculation based on gig duration
    - Comprehensive order status change notifications
    - Enhanced message notifications with sender info
*/

-- Add email notifications preference to users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add deadline and status_updated_at to orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE orders ADD COLUMN deadline timestamptz;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status_updated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN status_updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update handle_new_message function to include email data
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  recipient_email text;
  recipient_notifications_enabled boolean;
  gig_title text;
  sender_name text;
BEGIN
  -- Get order details and recipient info
  WITH order_details AS (
    SELECT 
      o.client_id,
      o.gig_id,
      g.provider_id,
      g.title as gig_title,
      CASE 
        WHEN NEW.sender_id = o.client_id THEN g.provider_id
        ELSE o.client_id
      END as recipient_id
    FROM orders o
    JOIN gigs g ON o.gig_id = g.id
    WHERE o.id = NEW.order_id
  )
  SELECT 
    od.recipient_id,
    od.gig_title,
    u.email,
    u.email_notifications_enabled,
    sender.username
  INTO 
    recipient_id,
    gig_title,
    recipient_email,
    recipient_notifications_enabled,
    sender_name
  FROM order_details od
  JOIN users u ON u.id = od.recipient_id
  JOIN users sender ON sender.id = NEW.sender_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  VALUES (
    recipient_id,
    'message',
    'New message received',
    'You have a new message from ' || sender_name || ' regarding ' || gig_title,
    jsonb_build_object(
      'order_id', NEW.order_id,
      'message_id', NEW.id,
      'gig_id', NEW.order_id,
      'sender_name', sender_name,
      'recipient_email', recipient_email,
      'send_email', recipient_notifications_enabled
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new orders
CREATE OR REPLACE FUNCTION handle_new_order()
RETURNS TRIGGER AS $$
DECLARE
  provider_email text;
  provider_notifications_enabled boolean;
  client_name text;
  gig_title text;
BEGIN
  -- Get provider info and gig details
  SELECT 
    u.email,
    u.email_notifications_enabled,
    c.username as client_name,
    g.title as gig_title
  INTO 
    provider_email,
    provider_notifications_enabled,
    client_name,
    gig_title
  FROM gigs g
  JOIN users u ON u.id = g.provider_id
  JOIN users c ON c.id = NEW.client_id
  WHERE g.id = NEW.gig_id;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  VALUES (
    (SELECT provider_id FROM gigs WHERE id = NEW.gig_id),
    'order',
    'New order received',
    'You have a new order from ' || client_name || ' for ' || gig_title,
    jsonb_build_object(
      'order_id', NEW.id,
      'gig_id', NEW.gig_id,
      'client_name', client_name,
      'recipient_email', provider_email,
      'send_email', provider_notifications_enabled
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle order status changes
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status has changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Update status_updated_at
  NEW.status_updated_at = now();

  -- Set deadline based on gig duration when order moves to in_progress
  IF NEW.status = 'in_progress' AND OLD.status = 'pending' THEN
    SELECT now() + (duration || ' days')::interval 
    INTO NEW.deadline
    FROM gigs 
    WHERE id = NEW.gig_id;
  END IF;

  -- Create notifications for status changes
  WITH order_details AS (
    SELECT 
      o.client_id,
      o.gig_id,
      g.provider_id,
      g.title as gig_title,
      u.email as client_email,
      u.email_notifications_enabled as client_notifications_enabled,
      p.email as provider_email,
      p.email_notifications_enabled as provider_notifications_enabled
    FROM orders o
    JOIN gigs g ON o.gig_id = g.id
    JOIN users u ON o.client_id = u.id
    JOIN users p ON g.provider_id = p.id
    WHERE o.id = NEW.id
  )
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  SELECT
    -- Send notification to both client and provider
    unnest(ARRAY[od.client_id, od.provider_id]) as user_id,
    'order_status',
    CASE NEW.status
      WHEN 'in_progress' THEN 'Order Started'
      WHEN 'completed' THEN 'Order Completed'
      WHEN 'cancelled' THEN 'Order Cancelled'
      ELSE 'Order Status Updated'
    END as title,
    CASE NEW.status
      WHEN 'in_progress' THEN 'Work has begun on your order: ' || od.gig_title
      WHEN 'completed' THEN 'Order completed: ' || od.gig_title
      WHEN 'cancelled' THEN 'Order cancelled: ' || od.gig_title
      ELSE 'Order status updated to ' || NEW.status || ': ' || od.gig_title
    END as content,
    jsonb_build_object(
      'order_id', NEW.id,
      'gig_id', od.gig_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'recipient_email', CASE 
        WHEN unnest(ARRAY[od.client_id, od.provider_id]) = od.client_id THEN od.client_email
        ELSE od.provider_email
      END,
      'send_email', CASE 
        WHEN unnest(ARRAY[od.client_id, od.provider_id]) = od.client_id THEN od.client_notifications_enabled
        ELSE od.provider_notifications_enabled
      END
    ) as data
  FROM order_details od;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_new_order'
  ) THEN
    CREATE TRIGGER on_new_order
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_order();
  END IF;
END $$;

-- Create trigger for order status changes if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_order_status_change'
  ) THEN
    CREATE TRIGGER on_order_status_change
      BEFORE UPDATE OF status ON orders
      FOR EACH ROW
      EXECUTE FUNCTION handle_order_status_change();
  END IF;
END $$;

-- Create indexes for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_gig_id ON orders(gig_id);