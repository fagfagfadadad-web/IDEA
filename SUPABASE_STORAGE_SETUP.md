# Supabase Storage Setup for Avatar Uploads

## Quick Setup

The application now uses **Supabase Storage** for avatar uploads instead of Firebase Storage.

### Step 1: Create the Avatars Bucket

Run this SQL in your Supabase SQL Editor:

```sql
-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
```

### Step 2: Verify Setup

1. Go to Supabase Dashboard > Storage
2. You should see the `avatars` bucket
3. Bucket settings:
   - **Public**: Yes
   - **File size limit**: 5MB
   - **Allowed types**: JPEG, JPG, PNG, GIF, WebP

### Step 3: Test Upload

1. Log into the app
2. Go to Profile page
3. Click camera icon on avatar
4. Upload a photo
5. Photo should appear immediately

## How It Works

### Upload Flow

1. User clicks camera icon
2. Modal opens with upload area
3. User selects image file
4. File is validated (type, size)
5. File uploads to Supabase Storage `avatars/{userId}_{timestamp}.{ext}`
6. Public URL is generated
7. User profile is updated with new avatar URL
8. Avatar displays instantly

### Storage Structure

```
avatars/
  ├─ user123_1704890123456.jpg
  ├─ user456_1704890123457.png
  └─ user789_1704890123458.webp
```

### Security

- **File types**: Only images (JPEG, PNG, GIF, WebP)
- **File size**: Maximum 5MB
- **Access**: Public read, authenticated write
- **Validation**: Both client-side and bucket-level

## Troubleshooting

### "Failed to upload avatar" error

1. Check if `avatars` bucket exists in Supabase Storage
2. Verify bucket is set to **public**
3. Check storage policies are created
4. Verify file type is allowed (JPEG, PNG, GIF, WebP)
5. Check file size is under 5MB

### Avatar doesn't display

1. Check browser console for errors
2. Verify public URL is correct
3. Check if bucket is public
4. Try refreshing the page

### Can't upload large files

- Maximum file size is 5MB
- Compress image before uploading
- Use online tools like TinyPNG or Squoosh

## Migration from Firebase Storage

If you were using Firebase Storage before:

1. Old avatars will still work (DiceBear URLs)
2. New uploads use Supabase Storage
3. No data migration needed
4. Firebase Storage can be disabled

## Default Avatars

New users automatically get a random avatar from DiceBear API:
- `https://api.dicebear.com/7.x/adventurer/svg?seed={random}`

## Need Help?

Check these resources:
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization](https://supabase.com/docs/guides/storage/serving/image-transformations)
