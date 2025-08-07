import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File, bucket: string = 'gig-media', folder: string = 'images'): Promise<string> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file:', { fileName, fileSize: file.size, fileType: file.type });

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);
      setUploadProgress(100);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleFiles = async (
    files: File[], 
    bucket: string = 'gig-media', 
    folder: string = 'images'
  ): Promise<string[]> => {
    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i + 1) / files.length) * 100);
        
        const url = await uploadFile(file, bucket, folder);
        uploadedUrls.push(url);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (fileName: string, bucket: string = 'gig-media'): Promise<void> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      console.log('File deleted successfully:', fileName);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    isUploading,
    uploadProgress
  };
};