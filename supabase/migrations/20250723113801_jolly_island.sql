/*
  # Add messaging system for order communication

  1. New Tables
    - messages
      - id (uuid, primary key)
      - order_id (uuid, references orders)
      - sender_id (uuid, references users)
      - content (text)
      - created_at (timestamp)
      
  2. Security
    - Enable RLS on messages table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  sender_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Only allow participants of the order to read messages
CREATE POLICY "Users can read messages for their orders"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = messages.order_id
      AND (o.client_id = auth.uid() OR g.provider_id = auth.uid())
    )
  );

-- Allow users to send messages for their orders
CREATE POLICY "Users can send messages for their orders"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = order_id
      AND (o.client_id = auth.uid() OR g.provider_id = auth.uid())
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);