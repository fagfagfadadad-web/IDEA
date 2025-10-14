import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export class ImageStorageService {
  private static readonly STORAGE_PATH = 'pet-images';

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
      const fileName = `${this.STORAGE_PATH}/${userId}/${petId}_${Date.now()}.${fileExt}`;

      console.log('📤 Uploading image to Firebase Storage:', fileName);

      const storageRef = ref(storage, fileName);

      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=3600'
      });

      const publicUrl = await getDownloadURL(uploadResult.ref);

      console.log('✅ Image uploaded successfully:', publicUrl);

      return {
        success: true,
        publicUrl
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

      const storageRef = ref(storage, fileName);
      await deleteObject(storageRef);

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

      const petImagesIndex = pathParts.findIndex(part => part === this.STORAGE_PATH);

      if (petImagesIndex !== -1 && petImagesIndex < pathParts.length - 1) {
        return pathParts.slice(petImagesIndex).join('/');
      }

      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
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
