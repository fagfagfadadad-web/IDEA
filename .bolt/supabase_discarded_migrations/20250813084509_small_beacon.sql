/*
  # Add claimed payment status

  1. Database Changes
    - Update orders table payment_status constraint to include 'claimed'
    - This allows tracking when providers have claimed their payments

  2. Security
    - No RLS changes needed as this only extends existing enum values

  3. Notes
    - This migration safely adds the 'claimed' status to existing payment_status options
    - Existing data remains unchanged
*/

-- Add 'claimed' to the payment_status check constraint
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_payment_status_check' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;
  END IF;
  
  -- Add the new constraint with 'claimed' included
  ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'released'::text, 'claimed'::text, 'disputed'::text, 'resolved'::text]));
END $$;