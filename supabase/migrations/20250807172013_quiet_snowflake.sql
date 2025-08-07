/*
  # Add Admin Address

  1. Updates
    - Set user with wallet address `erd1z88e7ssktfwwkeaf9qmyezdf6qt6vskk4fdac2jnaupq45uzpmuq7caumu` as admin
    - Creates user record if it doesn't exist
    - Ensures admin privileges are properly set

  2. Security
    - Only affects the specific wallet address
    - Sets is_admin to true for this address
*/

-- First, try to update existing user with this wallet address
UPDATE users 
SET is_admin = true 
WHERE wallet_address = 'erd1z88e7ssktfwwkeaf9qmyezdf6qt6vskk4fdac2jnaupq45uzpmuq7caumu';

-- If no user exists with this wallet address, create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE wallet_address = 'erd1z88e7ssktfwwkeaf9qmyezdf6qt6vskk4fdac2jnaupq45uzpmuq7caumu'
  ) THEN
    INSERT INTO users (
      id,
      username,
      wallet_address,
      is_admin,
      email_notifications_enabled,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'admin_' || substring('erd1z88e7ssktfwwkeaf9qmyezdf6qt6vskk4fdac2jnaupq45uzpmuq7caumu', 5, 8),
      'erd1z88e7ssktfwwkeaf9qmyezdf6qt6vskk4fdac2jnaupq45uzpmuq7caumu',
      true,
      false,
      now()
    );
  END IF;
END $$;