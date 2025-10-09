# Firebase Storage Setup for Avatar Uploads

## Quick Setup Guide

### Step 1: Deploy Storage Rules to Firebase

You need to deploy the storage rules to your Firebase project. There are two ways to do this:

#### Option A: Using Firebase CLI (Recommended)

1. Install Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project (if not already done):
```bash
firebase init
```
Select "Storage" when prompted.

4. Deploy storage rules:
```bash
firebase deploy --only storage
```

#### Option B: Manually in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **zend-45ae2**
3. Click on **Storage** in the left menu
4. Click on the **Rules** tab
5. Replace the existing rules with:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Avatar uploads - anyone can upload and read
    match /avatars/{fileName} {
      // Allow read access to all avatar images
      allow read: if true;

      // Allow write (upload) for authenticated users or anyone
      allow write: if true;

      // Validate file is an image and under 5MB
      allow create: if request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');

      // Allow updates to existing files
      allow update: if request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');

      // Allow delete
      allow delete: if true;
    }
  }
}
```

6. Click **Publish**

### Step 2: Create the avatars folder (Optional)

Firebase Storage will automatically create the `avatars/` folder when the first file is uploaded. No manual action needed.

### Step 3: Verify Setup

1. Go to Firebase Console > Storage
2. Check that the rules are active
3. Try uploading an avatar from your app
4. Check the `avatars/` folder in Firebase Storage

## How It Works

### Upload Flow

1. User clicks camera icon on profile
2. Modal opens with upload area
3. User selects image file
4. File is validated (type, size)
5. File uploads to Firebase Storage `avatars/{userId}_{timestamp}.{ext}`
6. Download URL is generated
7. User profile is updated with new avatar URL
8. Avatar displays instantly

### Storage Structure

```
gs://zend-45ae2.appspot.com/
└── avatars/
    ├── user123_1704890123456.jpg
    ├── user456_1704890123457.png
    └── user789_1704890123458.webp
```

### Security Rules Explained

- **Read**: Public access to all avatar images
- **Write**: Anyone can upload (you may want to restrict this to authenticated users in production)
- **File Type**: Only images allowed (JPEG, PNG, GIF, WebP)
- **File Size**: Maximum 5MB
- **Path**: Files must be in the `avatars/` folder

## Troubleshooting

### "Failed to upload avatar" error

1. **Check Firebase Console**
   - Go to Storage section
   - Verify rules are published
   - Check for any error messages

2. **Check Browser Console**
   - Look for specific error messages
   - Common errors:
     - `storage/unauthorized`: Rules not deployed or incorrect
     - `storage/canceled`: User canceled upload
     - `storage/quota-exceeded`: Storage quota exceeded

3. **Verify Firebase Config**
   - Check `.env` file has correct Firebase credentials
   - Verify `VITE_FIREBASE_STORAGE_BUCKET` is set to `zend-45ae2.appspot.com`

### Avatar doesn't display

1. Check if URL is correct in browser console
2. Verify Firebase Storage bucket is public
3. Check if file was actually uploaded (Firebase Console > Storage)
4. Try clearing browser cache

### Upload is slow

- Firebase Storage upload speed depends on:
  - File size (larger files take longer)
  - Network connection
  - Firebase region

Optimize by:
- Compressing images before upload
- Using WebP format (smaller file size)
- Asking users to use images under 2MB

## Firebase Project Info

- **Project ID**: zend-45ae2
- **Storage Bucket**: zend-45ae2.appspot.com
- **Region**: (check in Firebase Console)

## Security Recommendations for Production

For production, you should update the rules to be more restrictive:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}_{timestamp}.{ext} {
      // Only authenticated users can upload
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');

      // Users can only update/delete their own avatars
      allow update, delete: if request.auth != null
                            && request.auth.uid == userId;
    }
  }
}
```

## Need Help?

Check these resources:
- [Firebase Storage Docs](https://firebase.google.com/docs/storage)
- [Firebase Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
