/*
  # Add social media columns to users table

  1. New Columns
    - `twitter_url` (text, nullable) - Twitter profile URL
    - `github_url` (text, nullable) - GitHub profile URL  
    - `linkedin_url` (text, nullable) - LinkedIn profile URL
    - `website_url` (text, nullable) - Personal website URL
    - `discord_username` (text, nullable) - Discord username
    - `telegram_username` (text, nullable) - Telegram username

  2. Safety
    - Uses IF NOT EXISTS checks to prevent errors if columns already exist
    - All columns are nullable (optional)
*/

-- Add twitter_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE users ADD COLUMN twitter_url text;
  END IF;
END $$;

-- Add github_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE users ADD COLUMN github_url text;
  END IF;
END $$;

-- Add linkedin_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE users ADD COLUMN linkedin_url text;
  END IF;
END $$;

-- Add website_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE users ADD COLUMN website_url text;
  END IF;
END $$;

-- Add discord_username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'discord_username'
  ) THEN
    ALTER TABLE users ADD COLUMN discord_username text;
  END IF;
END $$;

-- Add telegram_username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telegram_username'
  ) THEN
    ALTER TABLE users ADD COLUMN telegram_username text;
  END IF;
END $$;