/*
  # Fix users table ID column configuration

  1. Changes
    - Ensure id column has proper UUID default value
    - Fix auto-generation of UUIDs for new users
    - Update existing null IDs if any exist

  2. Security
    - Maintains existing RLS policies
    - No changes to security model
*/

-- First, update any existing rows with null IDs (if any)
UPDATE users 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- Ensure the id column has the correct default value
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure the id column is properly configured as NOT NULL
ALTER TABLE users 
ALTER COLUMN id SET NOT NULL;