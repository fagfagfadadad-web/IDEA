import { supabase } from '../lib/supabase';

export interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export class ImageStorageService {
  private static readonly BUCKET_NAME = 'pet-images';

  static async uploadPetImage(
    imageData: string | Blob,
    petId: string,
    userId: string
  ): Promise<UploadImageResult> {
    try {
      let blob: Blob;

      if (typeof imageData === 'string') {
        blob = this.base64ToBlob(imageData);
      } else {
        blob = imageData;
      }

      const fileExt = 'webp';
      const fileName = `${userId}/${petId}_${Date.now()}.${fileExt}`;

      console.log('📤 Uploading image to Supabase Storage:', fileName);

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Error uploading to Supabase:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('✅ Image uploaded successfully:', urlData.publicUrl);

      return {
        success: true,
        publicUrl: urlData.publicUrl
      };
    } catch (error: any) {
      console.error('❌ Error in uploadPetImage:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  }

  static async deletePetImage(imageUrl: string): Promise<boolean> {
    try {
      const fileName = this.extractFileNameFromUrl(imageUrl);

      if (!fileName) {
        console.warn('⚠️ Could not extract filename from URL');
        return false;
      }

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('❌ Error deleting image:', error);
        return false;
      }

      console.log('🗑️ Image deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in deletePetImage:', error);
      return false;
    }
  }

  private static base64ToBlob(base64Data: string): Blob {
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/webp' });
  }

  private static extractFileNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.BUCKET_NAME);

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  static async ensureBucketExists(): Promise<boolean> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        console.log('📦 Creating pet-images bucket...');

        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880
        });

        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          return false;
        }

        console.log('✅ Bucket created successfully');
      }

      return true;
    } catch (error) {
      console.error('❌ Error in ensureBucketExists:', error);
      return false;
    }
  }

  static async compressImage(imageData: string, quality: number = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/webp', quality));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  }
}
