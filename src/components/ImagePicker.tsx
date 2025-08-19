import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface ImagePickerProps {
  value?: string;
  onDataUrl: (dataUrl: string) => void;
  onRemove?: () => void;
  label?: string;
  accept?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ 
  value, 
  onDataUrl, 
  onRemove,
  label = "Choose Image",
  accept = "image/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onDataUrl(dataUrl);
        setIsLoading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file');
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Selected image"
            className="w-full h-32 object-cover rounded-lg border border-gray-600"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              onClick={handleClick}
              className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
              disabled={isLoading}
            >
              <Upload size={16} />
            </Button>
            <Button
              onClick={handleRemove}
              className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-gray-800/50"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span className="text-sm text-gray-400">Processing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon size={24} className="text-gray-400" />
              <span className="text-sm text-gray-400">{label}</span>
              <span className="text-xs text-gray-500">Click to upload</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};