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
- `POST /craft` - Craft an item from a recipe (protected)
  - Body: `{ recipeId: string }`

### Gamification

- `GET /me/progress` - Get player progression (level, XP, streaks) (protected)
- `GET /me/quests` - Get player's active and completed quests (protected)
- `POST /me/quests/:id/claim` - Claim quest rewards (protected)
- `GET /me/inventory` - Get player's inventory items (protected)

### Cosmetics

- `GET /cosmetics/themes` - Get all available themes
- `GET /cosmetics/themes/:id/skins` - Get table skins for a theme
- `GET /me/cosmetics` - Get player's cosmetics (unlocked themes/skins) (protected)
- `POST /me/cosmetics/theme` - Set active theme (protected)
  - Body: `{ themeId: string }`
- `POST /me/cosmetics/table-skin` - Set active table skin (protected)
  - Body: `{ skinId: string }`

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
- Products & Orders
- Cosmetics (Themes & Table Skins)
- AI-Generated Labels
- Events & Analytics

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
