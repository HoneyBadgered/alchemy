# The Alchemy Table - Web App

A Next.js-based web application providing a gamified e-commerce experience with cozy fantasy/alchemy aesthetics.

## Features

- 🧪 **Alchemy Table**: Interactive crafting interface for selecting ingredients and creating blends
- 📦 **Inventory**: View and manage collected ingredients and crafted items
- 🛒 **Shop**: Browse and purchase magical blends and potions
- ✨ **Appearance**: Customize your experience with themes and table skins
- 🏷️ **Label Studio**: Create AI-powered custom labels for your blends

## Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Animations**: Framer Motion
- **PWA Support**: Manifest-based progressive web app

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies from the monorepo root
cd ../..
npm install

# Or install from this directory
npm install
```

### Development

```bash
# Start the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Linting & Type Checking

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run type-check
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── table/          # Alchemy table page
│   │   ├── inventory/      # Inventory grid page
│   │   ├── shop/           # Shop/catalog page
│   │   ├── appearance/     # Theme customization page
│   │   ├── labels/         # Label studio page
│   │   ├── layout.tsx      # Root layout with PWA metadata
│   │   └── page.tsx        # Home page (redirects to table)
│   ├── components/         # Reusable React components
│   │   └── BottomNavigation.tsx
│   ├── lib/               # Utility functions
│   └── store/             # Zustand state management
├── public/                # Static assets
│   └── manifest.json      # PWA manifest
└── package.json

```

## Integration with Shared Packages

This app uses the following shared packages from the monorepo:

- `@alchemy/core`: Game logic (XP, quests, crafting, cosmetics)
- `@alchemy/sdk`: Typed API client
- `@alchemy/ui`: Design system and components

## Mobile-First Design

The app is built with a mobile-first approach:

- Responsive layouts that work on all screen sizes
- Bottom navigation optimized for thumb-friendly interaction
- Touch-optimized UI components
- PWA support for installation on mobile devices

## PWA Features

The app includes Progressive Web App capabilities:

- Installable on mobile and desktop
- Offline-ready manifest
- Mobile-optimized viewport settings
- Custom theme color (#9333ea - purple)

## Contributing

This is part of a monorepo. Please refer to the root README for contribution guidelines.

## License

See the root LICENSE file.
