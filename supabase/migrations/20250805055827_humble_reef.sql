/*
  # Add social media fields to users table

  1. New Columns
    - `twitter_url` (text, nullable) - Twitter profile URL
    - `github_url` (text, nullable) - GitHub profile URL  
    - `linkedin_url` (text, nullable) - LinkedIn profile URL
    - `website_url` (text, nullable) - Personal website URL
    - `discord_username` (text, nullable) - Discord username
    - `telegram_username` (text, nullable) - Telegram username

  2. Purpose
    - Allow users to showcase their social media presence
    - Enable better networking and professional connections
    - Provide additional ways for clients to verify provider credentials
*/

-- Add social media fields to users table
DO $$
BEGIN
  -- Add Twitter URL field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE users ADD COLUMN twitter_url text;
  END IF;

  -- Add GitHub URL field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE users ADD COLUMN github_url text;
  END IF;

  -- Add LinkedIn URL field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE users ADD COLUMN linkedin_url text;
  END IF;

  -- Add Website URL field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE users ADD COLUMN website_url text;
  END IF;

  -- Add Discord username field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'discord_username'
  ) THEN
    ALTER TABLE users ADD COLUMN discord_username text;
  END IF;

  -- Add Telegram username field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telegram_username'
  ) THEN
    ALTER TABLE users ADD COLUMN telegram_username text;
  END IF;
END $$;