import { supabase } from '../lib/supabase';

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
    const filePath = `avatars/${fileName}`;

    console.log('📤 StorageService: Uploading avatar to Supabase:', fileName);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ StorageService: Upload error:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicURL = urlData.publicUrl;
    console.log('✅ StorageService: Avatar uploaded successfully:', publicURL);

    return publicURL;
  }

  static async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl || !avatarUrl.includes('supabase')) {
      return;
    }

    try {
      const urlParts = avatarUrl.split('/avatars/');
      if (urlParts.length < 2) return;

      const fileName = urlParts[1].split('?')[0];
      const filePath = `avatars/${fileName}`;

      await supabase.storage
        .from('avatars')
        .remove([filePath]);

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
