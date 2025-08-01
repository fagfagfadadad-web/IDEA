/*
  # Set up authentication and user creation

  1. Changes
    - Enable UUID extension
    - Create trigger for automatic user creation from MultiversX auth
    - Set up trigger to handle new user creation

  2. Security
    - No changes to existing RLS policies
*/

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a trigger function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name)
  VALUES (
    new.id,
    SUBSTR(new.raw_user_meta_data->>'multiversx_address', 1, 8),
    null
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();