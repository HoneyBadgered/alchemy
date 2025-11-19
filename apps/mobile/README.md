# The Alchemy Table - Mobile App

An Expo React Native mobile application providing a gamified e-commerce experience with cozy fantasy/alchemy aesthetics.

## Features

- 🧪 **Alchemy Table**: Interactive crafting interface for selecting ingredients and creating blends
- 📦 **Inventory**: View and manage collected ingredients and crafted items
- 🛒 **Shop**: Browse and purchase magical blends and potions
- ✨ **Appearance**: Customize your experience with themes and table skins
- 🏷️ **Label Studio**: Create AI-powered custom labels for your blends

## Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **UI Library**: React Native
- **Navigation**: React Navigation v6 (Bottom Tabs + Native Stack)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI (will be installed via npx)

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
# Start the Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### Build

```bash
# Type check
npm run build

# Create production builds via Expo
npx expo build:android
npx expo build:ios
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── screens/              # React Native screens
│   │   ├── TableScreen.tsx       # Alchemy table
│   │   ├── InventoryScreen.tsx   # Inventory grid
│   │   ├── ShopScreen.tsx        # Shop/catalog
│   │   ├── AppearanceScreen.tsx  # Theme customization
│   │   └── LabelsScreen.tsx      # Label studio
│   ├── components/           # Reusable components
│   └── navigation/           # Navigation configuration
├── assets/                   # Images and static files
├── App.tsx                   # Root component with navigation
├── app.json                  # Expo configuration
└── package.json
```

## Integration with Shared Packages

This app uses the following shared packages from the monorepo:

- `@alchemy/core`: Game logic (XP, quests, crafting, cosmetics)
- `@alchemy/sdk`: Typed API client
- `@alchemy/ui`: Design system and components (with `.native.tsx` variants)

## Navigation

The app uses React Navigation with a bottom tab navigator for easy thumb-friendly navigation:

- **Table**: Main alchemy crafting interface
- **Inventory**: Item collection view
- **Shop**: Product catalog
- **Style**: Appearance customization
- **Labels**: Custom label creator

## Platform Support

- ✅ **iOS**: Full support
- ✅ **Android**: Full support
- ✅ **Web**: Supported via Expo web

## Development Tips

### Running on Physical Devices

1. Install the Expo Go app on your device
2. Scan the QR code shown in the terminal
3. The app will load on your device

### Debugging

- Use React Native Debugger
- Expo DevTools (press `m` in terminal)
- Console logs visible in terminal

## Styling

The app uses React Native's StyleSheet API for styling, maintaining consistency with the web app's design:

- Purple theme (#9333ea)
- Gradient backgrounds
- Card-based layouts
- Mobile-optimized spacing and touch targets

## Contributing

This is part of a monorepo. Please refer to the root README for contribution guidelines.

## License

See the root LICENSE file.
