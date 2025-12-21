# Image Upload System

This system provides image upload capabilities for products and ingredients with local file storage.

## API Endpoints

### Product Images

**Upload Single Product Image**
```
POST /upload/product-image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body: FormData with 'file' field
```

**Upload Multiple Product Images**
```
POST /upload/product-images
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body: FormData with multiple 'files' fields
```

**Delete Product Image**
```
DELETE /upload/product-image/:filename
Authorization: Bearer <admin-token>
```

### Ingredient Images

**Upload Single Ingredient Image**
```
POST /upload/ingredient-image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body: FormData with 'file' field
```

**Upload Multiple Ingredient Images**
```
POST /upload/ingredient-images
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body: FormData with multiple 'files' fields
```

**Delete Ingredient Image**
```
DELETE /upload/ingredient-image/:filename
Authorization: Bearer <admin-token>
```

## File Specifications

- **Allowed Types**: JPEG, JPG, PNG, WebP, GIF
- **Max File Size**: 5MB per file
- **Max Files per Request**: 10 files
- **Storage Location**: `apps/api/uploads/{products|ingredients}/`

## React Components

### ImageUpload

Single image upload component for admin forms.

```tsx
import ImageUpload from '@/components/admin/ImageUpload';

<ImageUpload
  type="product" // or "ingredient"
  currentImage="/uploads/products/image.jpg"
  accessToken={accessToken}
  onUploadComplete={(url) => console.log('Uploaded:', url)}
  onError={(error) => console.error(error)}
/>
```

### MultiImageUpload

Multiple image upload component with drag-to-reorder functionality.

```tsx
import MultiImageUpload from '@/components/admin/MultiImageUpload';

<MultiImageUpload
  type="product" // or "ingredient"
  currentImages={['/uploads/products/1.jpg', '/uploads/products/2.jpg']}
  accessToken={accessToken}
  maxImages={5}
  onUploadComplete={(urls) => console.log('Images:', urls)}
  onError={(error) => console.error(error)}
/>
```

## Usage Example

### In Admin Product Form

```tsx
const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
const { accessToken } = useAuthStore();

<ImageUpload
  type="product"
  currentImage={imageUrl}
  accessToken={accessToken}
  onUploadComplete={(url) => setImageUrl(url)}
  onError={(error) => alert(error)}
/>
```

### In Admin Ingredient Form

```tsx
const [imageUrl, setImageUrl] = useState(ingredient?.imageUrl || '');
const { accessToken } = useAuthStore();

<ImageUpload
  type="ingredient"
  currentImage={imageUrl}
  accessToken={accessToken}
  onUploadComplete={(url) => setImageUrl(url)}
  onError={(error) => alert(error)}
/>
```

## File Structure

```
apps/api/
  ├── uploads/
  │   ├── products/        # Product images
  │   └── ingredients/     # Ingredient images
  ├── src/
  │   ├── routes/
  │   │   └── file-upload.routes.ts
  │   └── services/
  │       └── file-upload.service.ts

apps/web/
  └── src/
      └── components/
          └── admin/
              ├── ImageUpload.tsx        # Single image upload
              └── MultiImageUpload.tsx   # Multiple image upload
```

## Security

- All upload endpoints require admin authentication
- File type validation (only images allowed)
- File size validation (max 5MB)
- Unique filename generation to prevent conflicts
- Files are stored outside the public directory for security

## Serving Uploaded Files

Uploaded files are served via Fastify Static at:
```
GET /uploads/products/:filename
GET /uploads/ingredients/:filename
```

The API server automatically serves files from the `uploads/` directory.
