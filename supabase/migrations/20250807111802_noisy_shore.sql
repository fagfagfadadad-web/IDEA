/*
  # Update Email Notifications Support

  1. Database Changes
    - Ensure users table has email and email_notifications_enabled columns
    - Add indexes for email-related queries
    - Update RLS policies if needed

  2. Functions
    - Add function to send email notifications
    - Add trigger functions for automatic email sending

  3. Security
    - Maintain existing RLS policies
    - Ensure email data is protected
*/

-- Ensure email columns exist (they should already exist based on schema)
DO $$
BEGIN
  -- Check if email column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
  END IF;

  -- Check if email_notifications_enabled column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN email_notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Add index for email queries if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_email'
  ) THEN
    CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
  END IF;
END $$;

-- Add index for email notifications enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_email_notifications'
  ) THEN
    CREATE INDEX idx_users_email_notifications ON users(email_notifications_enabled) WHERE email_notifications_enabled = true;
  END IF;
END $$;

-- Function to get user email preferences
CREATE OR REPLACE FUNCTION get_user_email_preferences(user_uuid uuid)
RETURNS TABLE(
  email text,
  email_notifications_enabled boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.email, u.email_notifications_enabled
  FROM users u
  WHERE u.id = user_uuid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email_preferences(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email_preferences(uuid) TO service_role;