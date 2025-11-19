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
├── config.ts              # Environment configuration
├── main.ts               # Application entry point
├── middleware/           # Auth and other middleware
├── routes/               # API route handlers
├── services/             # Business logic
└── utils/                # Utilities (JWT, password, Prisma)
```
