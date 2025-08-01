/*
  # Add file attachments to messages

  1. Changes
    - Add attachments column to messages table
    - Create storage bucket for chat attachments
    - Add storage policies for secure file access
    
  2. Security
    - Users can only upload files to their own order folders
    - Public read access for attachments
    - Authenticated upload only
*/

-- Add attachments to messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create the storage bucket if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chat-attachments', 'chat-attachments', true);
  END IF;
END $$;

-- Create policy to allow authenticated users to upload files to their orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload attachments to their orders'
  ) THEN
    CREATE POLICY "Users can upload attachments to their orders" 
    ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
      bucket_id = 'chat-attachments' AND
      (auth.uid() IN (
        SELECT client_id FROM orders WHERE id::text = (string_to_array(name, '/'))[1]
        UNION
        SELECT g.provider_id FROM orders o
        JOIN gigs g ON o.gig_id = g.id
        WHERE o.id::text = (string_to_array(name, '/'))[1]
      ))
    );
  END IF;
END $$;

-- Create policy to allow public access to read files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view attachments'
  ) THEN
    CREATE POLICY "Anyone can view attachments" 
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'chat-attachments');
  END IF;
END $$;

-- Create policy to allow users to delete their own attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own attachments'
  ) THEN
    CREATE POLICY "Users can delete their own attachments" 
    ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (
      bucket_id = 'chat-attachments' AND
      (auth.uid() IN (
        SELECT client_id FROM orders WHERE id::text = (string_to_array(name, '/'))[1]
        UNION
        SELECT g.provider_id FROM orders o
        JOIN gigs g ON o.gig_id = g.id
        WHERE o.id::text = (string_to_array(name, '/'))[1]
      ))
    );
  END IF;
END $$;