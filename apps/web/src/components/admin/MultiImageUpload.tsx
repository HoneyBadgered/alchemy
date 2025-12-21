'use client';

/**
 * Multiple Image Upload Component
 * Allows uploading and managing multiple images for products/ingredients
 */

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface MultiImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onError?: (error: string) => void;
  currentImages?: string[];
  accessToken: string;
  type?: 'product' | 'ingredient';
  maxImages?: number;
}

export default function MultiImageUpload({ 
  onUploadComplete, 
  onError,
  currentImages = [],
  accessToken,
  type = 'product',
  maxImages = 5,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(currentImages);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      onError?.(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        onError?.('Please select only image files');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onError?.('Each file must be less than 5MB');
        return;
      }
    }

    // Upload files
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const endpoint = type === 'product' ? '/upload/product-images' : '/upload/ingredient-images';
      const response = await fetch(`${API_URL}${endpoint}`, {
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
      const newUrls = data.files.map((f: any) => `${API_URL}${f.url}`);
      const updatedImages = [...images, ...newUrls];
      setImages(updatedImages);
      onUploadComplete(updatedImages);
    } catch (error) {
      onError?.((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onUploadComplete(updatedImages);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [removed] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, removed);
    setImages(updatedImages);
    onUploadComplete(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Remove
              </button>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleReorder(index, index - 1)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                >
                  ←
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleReorder(index, index + 1)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                >
                  →
                </button>
              )}
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <div className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 transition ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              {uploading ? (
                <span className="text-gray-500 text-sm">Uploading...</span>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-gray-500 text-sm">Add Image</span>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Upload up to {maxImages} images. First image will be the primary image.
        JPG, PNG, WebP, GIF. Max 5MB each.
      </p>
    </div>
  );
}
