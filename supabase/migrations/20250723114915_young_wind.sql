/*
  # Set Admin Privileges

  1. Updates
    - Set is_admin = true for the specified wallet address
    - This will grant admin access to the user with wallet address erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t

  2. Security
    - Only updates the specific user account
    - Maintains existing RLS policies
*/

-- Set admin privileges for the specified wallet address
UPDATE users 
SET is_admin = true 
WHERE wallet_address = 'erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t';

-- Verify the update (this will show in logs)
DO $$
DECLARE
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM users 
    WHERE wallet_address = 'erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t' 
    AND is_admin = true;
    
    IF admin_count > 0 THEN
        RAISE NOTICE 'Admin privileges successfully granted to wallet address erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t';
    ELSE
        RAISE NOTICE 'Warning: User with wallet address erd188zn8a324x39egg9xa8ll4ngpq4dw46ug88kh5m7e9qcnhfe6x7s8jra6t not found or admin privileges not set';
    END IF;
END $$;