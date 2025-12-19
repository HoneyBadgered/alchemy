# Product Inventory Management API Documentation

## Overview

This document describes the new API endpoints for product inventory management, including image uploads and bulk product imports.

## Authentication

All endpoints require admin authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## File Upload Endpoints

### Upload Single Product Image

Upload a single image for a product.

**Endpoint:** `POST /upload/product-image`

**Authentication:** Admin required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): Image file (JPG, PNG, WebP, or GIF)

**Validation:**
- File size: Maximum 5MB
- File type: Must be an image (JPG, PNG, WebP, GIF)

**Response (200 OK):**
```json
{
  "filename": "1234567890-abc123def456.jpg",
  "originalName": "product-image.jpg",
  "mimetype": "image/jpeg",
  "size": 102400,
  "url": "/uploads/products/1234567890-abc123def456.jpg",
  "path": "/absolute/path/to/uploads/products/1234567890-abc123def456.jpg"
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded, invalid file type, or file too large
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User is not an admin

**Example:**
```bash
curl -X POST http://localhost:3000/upload/product-image \
  -H "Authorization: Bearer <token>" \
  -F "file=@product-image.jpg"
```

---

### Upload Multiple Product Images

Upload multiple images at once.

**Endpoint:** `POST /upload/product-images`

**Authentication:** Admin required

**Content-Type:** `multipart/form-data`

**Request Body:**
- Multiple `file` fields (up to 10 files)

**Response (200 OK):**
```json
{
  "files": [
    {
      "filename": "1234567890-abc123def456.jpg",
      "originalName": "image1.jpg",
      "mimetype": "image/jpeg",
      "size": 102400,
      "url": "/uploads/products/1234567890-abc123def456.jpg",
      "path": "/absolute/path/to/file.jpg"
    },
    {
      "filename": "1234567891-def456abc789.jpg",
      "originalName": "image2.jpg",
      "mimetype": "image/jpeg",
      "size": 98304,
      "url": "/uploads/products/1234567891-def456abc789.jpg",
      "path": "/absolute/path/to/file2.jpg"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/upload/product-images \
  -H "Authorization: Bearer <token>" \
  -F "file=@image1.jpg" \
  -F "file=@image2.jpg"
```

---

### Delete Product Image

Delete an uploaded product image.

**Endpoint:** `DELETE /upload/product-image/:filename`

**Authentication:** Admin required

**URL Parameters:**
- `filename` (required): The filename to delete (e.g., `1234567890-abc123def456.jpg`)

**Response (200 OK):**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/upload/product-image/1234567890-abc123def456.jpg \
  -H "Authorization: Bearer <token>"
```

---

### Serve Uploaded Files

Uploaded files are automatically served via the static file endpoint.

**Endpoint:** `GET /uploads/products/:filename`

**Authentication:** None (public access)

**Example:**
```
http://localhost:3000/uploads/products/1234567890-abc123def456.jpg
```

---

## Product Import Endpoints

### Download CSV Template

Download a CSV template with headers and an example row.

**Endpoint:** `GET /admin/products/import/template`

**Authentication:** Admin required

**Response:** CSV file download

**CSV Format:**
```csv
name,description,price,stock,category,imageUrl,images,tags,isActive,compareAtPrice,lowStockThreshold
Sample Product,A detailed description of the product,19.99,50,Coffee Blends,https://example.com/image.jpg,https://example.com/img1.jpg,https://example.com/img2.jpg,coffee,blend,morning,true,24.99,10
```

**Example:**
```bash
curl http://localhost:3000/admin/products/import/template \
  -H "Authorization: Bearer <token>" \
  -o product-template.csv
```

---

### Validate CSV File

Validate a CSV file before importing to check for format errors.

**Endpoint:** `POST /admin/products/import/validate`

**Authentication:** Admin required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): CSV file to validate

**Response (200 OK - Valid):**
```json
{
  "valid": true,
  "errors": []
}
```

**Response (200 OK - Invalid):**
```json
{
  "valid": false,
  "errors": [
    "Missing required column: description",
    "Missing required column: price"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/admin/products/import/validate \
  -H "Authorization: Bearer <token>" \
  -F "file=@products.csv"
```

---

### Import Products from CSV

Import products in bulk from a CSV file.

**Endpoint:** `POST /admin/products/import`

**Authentication:** Admin required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required): CSV file with product data

**Response (200 OK):**
```json
{
  "success": true,
  "imported": 45,
  "failed": 5,
  "errors": [
    {
      "row": 12,
      "error": "Valid price is required",
      "data": {
        "name": "Product Name",
        "description": "Description",
        "price": "invalid"
      }
    },
    {
      "row": 23,
      "error": "Name is required",
      "data": {
        "name": "",
        "description": "Description",
        "price": "19.99"
      }
    }
  ]
}
```

**CSV Column Specifications:**

| Column | Required | Type | Description | Example |
|--------|----------|------|-------------|---------|
| `name` | Yes | String | Product name | `"Mystic Morning Blend"` |
| `description` | Yes | String | Product description | `"A smooth blend of..."` |
| `price` | Yes | Decimal | Product price | `19.99` |
| `stock` | No | Integer | Stock quantity (default: 0) | `50` |
| `category` | No | String | Product category | `"Coffee Blends"` |
| `imageUrl` | No | String (URL) | Main product image URL | `"https://example.com/img.jpg"` |
| `images` | No | String (comma-separated URLs) | Additional images | `"https://ex.com/1.jpg,https://ex.com/2.jpg"` |
| `tags` | No | String (comma-separated) | Product tags | `"coffee,blend,morning"` |
| `isActive` | No | Boolean | Active status (default: true) | `true` or `false` |
| `compareAtPrice` | No | Decimal | Original price for sale items | `24.99` |
| `lowStockThreshold` | No | Integer | Low stock warning level (default: 5) | `10` |

**Validation Rules:**
- `name`: Must not be empty
- `description`: Must not be empty
- `price`: Must be a positive number
- `stock`: Must be a non-negative integer (if provided)
- `isActive`: Accepts `true`, `false`, `1`, or `0`
- All URLs must be valid format
- Tags and images are parsed as comma-separated values

**Example:**
```bash
curl -X POST http://localhost:3000/admin/products/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@products.csv"
```

---

## Error Handling

All endpoints return consistent error responses:

**401 Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "message": "Admin access required"
}
```

**400 Bad Request:**
```json
{
  "message": "No file uploaded"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Error message describing the issue"
}
```

---

## Rate Limiting

All endpoints are subject to the global rate limit:
- **100 requests per 15 minutes** per IP address
- Localhost (127.0.0.1) is whitelisted in development

---

## File Storage

Uploaded files are stored in:
- **Directory:** `./uploads/products/`
- **File naming:** `{timestamp}-{random-hash}.{extension}`
- **Permissions:** Files are stored with standard filesystem permissions

**Production Recommendations:**
- Configure external storage (AWS S3, CloudFlare R2, etc.)
- Set up CDN for serving images
- Implement image optimization/resizing
- Add virus scanning for uploaded files
- Configure backup strategy for uploads directory

---

## Security Considerations

1. **Authentication:** All admin endpoints require valid JWT token
2. **File Type Validation:** Only image files (JPG, PNG, WebP, GIF) are accepted
3. **File Size Limits:** Maximum 5MB per file
4. **Input Sanitization:** All CSV inputs are validated and sanitized
5. **SQL Injection Protection:** Using Prisma ORM with parameterized queries
6. **Rate Limiting:** Prevents abuse of upload endpoints

---

## Best Practices

### Image Uploads
1. Always validate file size on client-side before upload
2. Show preview to users before uploading
3. Provide feedback during upload progress
4. Handle upload failures gracefully
5. Consider image optimization before upload

### CSV Imports
1. Always download and use the provided template
2. Validate CSV before importing
3. Review validation errors before attempting import
4. Keep a backup of CSV file before importing
5. Monitor import results and handle partial failures
6. Use reasonable batch sizes (recommend < 1000 products per import)

### Error Handling
1. Check for authentication errors (401/403)
2. Validate inputs before API calls
3. Handle network errors and timeouts
4. Provide user-friendly error messages
5. Log errors for debugging

---

## Example Workflows

### Upload Image for New Product

```javascript
// 1. Upload image
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('http://localhost:3000/upload/product-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});

const { url } = await uploadResponse.json();

// 2. Create product with image URL
const productResponse = await fetch('http://localhost:3000/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'New Product',
    description: 'Product description',
    price: 19.99,
    imageUrl: `http://localhost:3000${url}`,
    stock: 50,
    isActive: true,
  }),
});
```

### Bulk Import Products

```javascript
// 1. Download template
const templateResponse = await fetch(
  'http://localhost:3000/admin/products/import/template',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }
);
const templateBlob = await templateResponse.blob();

// 2. Validate CSV file
const validateFormData = new FormData();
validateFormData.append('file', csvFile);

const validateResponse = await fetch(
  'http://localhost:3000/admin/products/import/validate',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: validateFormData,
  }
);

const { valid, errors } = await validateResponse.json();

if (!valid) {
  console.error('Validation errors:', errors);
  return;
}

// 3. Import products
const importFormData = new FormData();
importFormData.append('file', csvFile);

const importResponse = await fetch(
  'http://localhost:3000/admin/products/import',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: importFormData,
  }
);

const result = await importResponse.json();
console.log(`Imported: ${result.imported}, Failed: ${result.failed}`);

if (result.errors.length > 0) {
  console.error('Import errors:', result.errors);
}
```

---

## Support

For issues or questions:
- Check error messages for details
- Review validation rules above
- Verify authentication token is valid
- Ensure file formats and sizes meet requirements
- Check server logs for detailed error information
