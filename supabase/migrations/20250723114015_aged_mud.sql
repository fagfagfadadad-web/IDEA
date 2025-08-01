/*
  # Add order requirements and notifications (Safe Version)

  1. Changes
    - Add email field to users table (if not exists)
    - Add requirements field to orders table (if not exists)
    - Create notifications table (if not exists)
    - Add automatic notification system for new messages
    
  2. Security
    - Enable RLS on notifications table
    - Add policies for reading notifications (if not exists)
    - Create secure trigger function for message notifications
*/

-- Add email field to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
  END IF;
END $$;

-- Add requirements to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE orders ADD COLUMN requirements jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications (only create if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can read own notifications'
  ) THEN
    CREATE POLICY "Users can read own notifications"
      ON notifications FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create function to handle new messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Get order details
  WITH order_details AS (
    SELECT 
      o.client_id,
      o.gig_id,
      g.provider_id,
      g.title as gig_title
    FROM orders o
    JOIN gigs g ON o.gig_id = g.id
    WHERE o.id = NEW.order_id
  )
  INSERT INTO notifications (user_id, type, title, content, data)
  SELECT
    CASE 
      WHEN NEW.sender_id = od.client_id THEN od.provider_id
      ELSE od.client_id
    END as user_id,
    'message',
    'New message received',
    'You have a new message regarding ' || od.gig_title,
    jsonb_build_object(
      'order_id', NEW.order_id,
      'message_id', NEW.id,
      'gig_id', od.gig_id
    )
  FROM order_details od;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_new_message'
  ) THEN
    CREATE TRIGGER on_new_message
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_message();
  END IF;
END $$;