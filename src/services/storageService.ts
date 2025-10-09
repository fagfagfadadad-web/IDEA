import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class StorageService {
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    console.log('🚀 StorageService: Starting upload process...');
    console.log('📝 File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      userId
    });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `avatars/${fileName}`);

    console.log('📤 StorageService: Uploading to Firebase Storage...');
    console.log('📍 Path:', `avatars/${fileName}`);
    console.log('🔧 Storage config:', {
      bucket: storage.app.options.storageBucket
    });

    try {
      console.log('⏳ Step 1: Starting uploadBytes...');
      const uploadPromise = uploadBytes(storageRef, file);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
      });

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
      console.log('✅ Step 1: Upload complete!');
      console.log('📊 Upload snapshot:', {
        fullPath: snapshot.ref.fullPath,
        bucket: snapshot.ref.bucket
      });

      console.log('⏳ Step 2: Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Step 2: Got download URL!');
      console.log('🔗 URL:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ StorageService: Upload failed!');
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });

      if (error.code === 'storage/unauthorized') {
        throw new Error('Permission denied. Please check Firebase Storage rules.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was canceled.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Upload timeout. Please check your internet connection.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }
  }

  static async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl || !avatarUrl.includes('firebase')) {
      return;
    }

    try {
      const avatarRef = ref(storage, avatarUrl);
      await deleteObject(avatarRef);
      console.log('🗑️ StorageService: Old avatar deleted');
    } catch (err) {
      console.log('⚠️ StorageService: Could not delete old avatar:', err);
    }
  }

  static getDefaultAvatars(): string[] {
    return [
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Rocky',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Duke',
      'https://api.dicebear.com/7.x/adventurer/svg?seed=Molly'
    ];
  }

  static generateRandomAvatar(): string {
    const seed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
  }
}
