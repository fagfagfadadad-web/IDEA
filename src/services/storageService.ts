import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class StorageService {
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `avatars/${fileName}`);

    console.log('📤 StorageService: Uploading avatar:', fileName);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    console.log('✅ StorageService: Avatar uploaded successfully:', downloadURL);

    return downloadURL;
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
