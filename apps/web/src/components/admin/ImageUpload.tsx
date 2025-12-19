'use client';

/**
 * Image Upload Component
 * Allows admin to upload product images
 */

import { useState } from 'react';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
  currentImage?: string;
  accessToken: string;
}

export default function ImageUpload({ 
  onUploadComplete, 
  onError,
  currentImage,
  accessToken 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/upload/product-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUploadComplete(`http://localhost:3000${data.url}`);
    } catch (error) {
      onError?.((error as Error).message);
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {preview && (
          <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <div className={`px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}>
            {uploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
          </div>
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Accepted formats: JPG, PNG, WebP, GIF. Max size: 5MB
      </p>
    </div>
  );
}
