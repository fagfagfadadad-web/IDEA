/*
  # Add unique constraint to wallet_address column

  1. Database Changes
    - Add unique constraint to `wallet_address` column in `users` table
    - Remove any duplicate entries before adding constraint
    - Ensure data integrity for wallet addresses

  2. Security
    - Prevents duplicate wallet addresses in the system
    - Ensures one profile per wallet address
*/

-- First, remove any duplicate entries (keep the first one created)
DELETE FROM users 
WHERE id NOT IN (
  SELECT DISTINCT ON (wallet_address) id 
  FROM users 
  WHERE wallet_address IS NOT NULL
  ORDER BY wallet_address, created_at ASC
);

-- Add unique constraint to wallet_address column
ALTER TABLE users 
ADD CONSTRAINT users_wallet_address_unique 
UNIQUE (wallet_address);