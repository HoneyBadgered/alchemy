# The Alchemy Table - API

Backend API for The Alchemy Table gamified e-commerce platform.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database with sample products
npm run prisma:seed
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## API Endpoints

### Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "error": "Short error description",
  "message": "Detailed error message",
  "statusCode": 400,
  "details": [] // Optional: Additional error details (e.g., validation errors)
}
```

**Common HTTP Status Codes**:
- `400` - Bad Request: Invalid input data or validation error
- `403` - Forbidden: User doesn't have permission to access resource
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists or action already performed
- `422` - Unprocessable Entity: Request is valid but business logic prevents action
- `500` - Internal Server Error: Unexpected server error

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `GET /me` - Get current user (protected)

### Catalog

- `GET /catalog/products` - Get paginated list of products
  - Query params: `page`, `perPage`, `category`
- `GET /catalog/products/:id` - Get product by ID

### Crafting

- `GET /recipes` - Get all available recipes (protected)
  - **Error Responses**:
    - `404`: Player state not found
    - `500`: Internal server error
- `POST /craft` - Craft an item from a recipe (protected)
  - Body: `{ recipeId: string }`
  - **Error Responses**:
    - `400`: Validation error (missing/invalid recipeId)
    - `404`: Recipe not found or player state not found
    - `422`: Cannot craft (insufficient level or ingredients)
    - `500`: Internal server error

### Gamification

- `GET /me/progress` - Get player progression (level, XP, streaks) (protected)
  - **Error Responses**:
    - `404`: Player state not found
    - `500`: Internal server error
- `GET /me/quests` - Get player's active and completed quests (protected)
  - **Error Responses**:
    - `404`: Player state not found
    - `500`: Internal server error
- `POST /me/quests/:id/claim` - Claim quest rewards (protected)
  - **Error Responses**:
    - `404`: Quest not found
    - `409`: Quest reward already claimed
    - `422`: Quest is not completed yet
    - `500`: Internal server error
- `GET /me/inventory` - Get player's inventory items (protected)
  - **Error Responses**:
    - `500`: Internal server error

### Cosmetics

- `GET /cosmetics/themes` - Get all available themes
  - **Error Responses**:
    - `500`: Internal server error
- `GET /cosmetics/themes/:id/skins` - Get table skins for a theme
  - **Error Responses**:
    - `404`: Theme not found or not available
    - `500`: Internal server error
- `GET /me/cosmetics` - Get player's cosmetics (unlocked themes/skins) (protected)
  - **Error Responses**:
    - `404`: Player cosmetics not found
    - `500`: Internal server error
- `POST /me/cosmetics/theme` - Set active theme (protected)
  - Body: `{ themeId: string }`
  - **Error Responses**:
    - `400`: Validation error (missing/invalid themeId) or theme not available
    - `403`: Theme not unlocked (player doesn't meet level requirement)
    - `404`: Theme not found, player state not found, or player cosmetics not found
    - `500`: Internal server error
- `POST /me/cosmetics/table-skin` - Set active table skin (protected)
  - Body: `{ skinId: string }`
  - **Error Responses**:
    - `400`: Validation error (missing/invalid skinId) or skin not available
    - `403`: Table skin not unlocked (player doesn't meet level requirement)
    - `404`: Skin not found, player state not found, or player cosmetics not found
    - `500`: Internal server error

### Labels (AI-Powered)

- `GET /orders/:orderId/labels` - Get labels for an order (protected)
- `POST /orders/:orderId/labels` - Generate a new AI label for an order (protected)
  - Body: `{ stylePreset?: string, tonePreset?: string, flavorNotes?: string, customPrompt?: string }`
- `PATCH /labels/:labelId` - Update label content (protected)
  - Body: `{ name?: string, tagline?: string, description?: string, artworkPrompt?: string, artworkUrl?: string }`
- `POST /labels/:labelId/approve` - Approve a label design (protected)

### Health

- `GET /health` - Health check

## Database Schema

See `prisma/schema.prisma` for the complete database schema including:

- User & Authentication
- Player Progression (XP, levels, streaks)
- Quests & Achievements
- Inventory & Items
- Recipes & Crafting
- Products & Orders (with tags and multiple images support)
- Cosmetics (Themes & Table Skins)
- AI-Generated Labels
- Events & Analytics

### Product Model

The Product model includes all key attributes for blends and items available for purchase:

- **id**: Unique identifier (CUID)
- **name**: Product name
- **description**: Detailed product description
- **price**: Decimal price (10,2 precision)
- **imageUrl**: Primary image URL (legacy, for backward compatibility)
- **images**: Array of image URLs for multiple product images
- **category**: Product category (e.g., "Coffee Blends", "Tea Blends", "Brewing Equipment")
- **tags**: Array of tags for filtering and search (e.g., ["coffee", "blend", "morning"])
- **isActive**: Boolean flag for product visibility
- **stock**: Available inventory quantity
- **createdAt/updatedAt**: Timestamps

### Seeding the Database

The seed script (`prisma/seed.ts`) populates the database with 15 sample products across 5 categories:

- **Coffee Blends** (4 products): Various coffee blends with different roast profiles
- **Tea Blends** (3 products): Earl Grey, herbal, and green tea blends
- **Brewing Equipment** (3 products): Pour over kit, grinder, kettle
- **Accessories** (3 products): Mugs, storage, scale
- **Specialty Items** (2 products): Cold brew kit, matcha set

Run the seed script with:

```bash
npm run prisma:seed
```

The seed script is idempotent - it won't create duplicate products if run multiple times.

## Project Structure

```
src/
├── __tests__/            # Test files
├── config.ts             # Environment configuration
├── main.ts               # Application entry point
├── middleware/           # Auth and other middleware
├── routes/               # API route handlers
│   ├── auth.routes.ts
│   ├── catalog.routes.ts
│   ├── crafting.routes.ts
│   ├── gamification.routes.ts
│   ├── cosmetics.routes.ts
│   └── labels.routes.ts
├── services/             # Business logic
│   ├── auth.service.ts
│   ├── catalog.service.ts
│   ├── crafting.service.ts
│   ├── gamification.service.ts
│   ├── cosmetics.service.ts
│   └── labels.service.ts
└── utils/                # Utilities (JWT, password, Prisma)
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage
```
