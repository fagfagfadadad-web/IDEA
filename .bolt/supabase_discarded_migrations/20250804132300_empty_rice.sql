/*
  # Clear Orders Table

  1. Database Cleanup
    - Remove all existing orders from the orders table
    - Reset the table for fresh testing
    - Keep table structure intact

  2. Safety
    - This will delete ALL order data
    - Use only for testing/development
*/

-- Clear all orders from the orders table
DELETE FROM orders;

-- Optional: Reset any sequences if needed
-- (PostgreSQL will handle UUID generation automatically)