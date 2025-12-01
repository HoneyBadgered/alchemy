# User Profile System

A comprehensive user profile experience with a dark-fairytale aesthetic for The Alchemy Table e-commerce platform.

## Overview

The User Profile system provides a cohesive, mystical experience for users to manage their account, view their journey through the platform, and personalize their experience.

## Features

### 1. Profile Dashboard (`/profile`)
The central hub for the user's alchemical journey.

**Features:**
- Personalized welcome greeting based on time of day
- Avatar display with tier badge
- Quick summary cards:
  - Recent order with status
  - Points balance with tier progress
  - Wishlist count
- Navigation grid to all profile sections
- Email verification reminder if not verified

**UX Copy:**
- Greeting: "Good morrow, [Name]" / "Midnight greetings, [Name]"
- Section title: "Your Alchemist's Quarters"
- Each section includes lore-inspired descriptions

### 2. Account Information (`/profile/account`)
Manage personal details and security settings.

**Features:**
- Profile avatar upload/selection
- Edit name, email
- Password change workflow with validation
- Account deletion with confirmation
- Member since date display

**Error Messages:**
- "Your arcane credentials have been updated successfully."
- "Failed to update profile. Please try again."
- "Passwords do not match."
- "Password must be at least 8 characters."

### 3. Order History (`/profile/orders`)
View and manage past orders.

**Features:**
- Paginated order list with status filtering
- Order status badges with icons
- Order item previews
- Reorder functionality (adds all items to cart)
- Download receipt button

**Status States:**
- Pending (⏳) - Amber
- Processing (⚗️) - Blue
- Shipped (📦) - Purple
- Completed (✅) - Green
- Cancelled (❌) - Red

### 4. Address Management (`/profile/addresses`)
Manage shipping addresses.

**Features:**
- Add new addresses with full form validation
- Edit existing addresses
- Delete addresses with confirmation
- Set default shipping address
- Support for US, Canada, UK

**Validation:**
- Required: First name, last name, address line 1, city, state, ZIP, country
- Optional: Address line 2, phone

### 5. Payment Methods (`/profile/payments`)
Manage saved payment options.

**Features:**
- List saved cards and PayPal accounts
- Add new payment methods (integrates with Stripe)
- Remove payment methods with confirmation
- Set default payment method
- Security notice about encrypted storage

**Supported Methods:**
- Credit/debit cards (Visa, Mastercard, Amex)
- PayPal

### 6. Rewards & Loyalty (`/profile/rewards`)
View points, tier status, and redeem rewards.

**Tier System:**
| Tier | Points Required | Icon | Benefits |
|------|-----------------|------|----------|
| Novice | 0 | 🌱 | 5% off first order, Birthday surprise |
| Adept | 500 | ⚗️ | 10% off, Early access, Free shipping $50+ |
| Alchemist | 2,000 | 🧙 | 15% off, Exclusive blends, Free expedited shipping |
| Grand Master | 5,000 | 👑 | 20% off, First access to limited editions, Concierge |

**Redemption Options:**
- Free Shipping (200 pts)
- $5 Off (300 pts)
- Mystery Sample (400 pts)
- $10 Off (500 pts)
- Double Points Day (750 pts)
- $25 Off (1,200 pts)

### 7. Subscriptions (`/profile/subscriptions`)
Manage recurring orders.

**Features:**
- Summary of active/paused subscriptions
- Upcoming shipment calendar
- Skip next shipment
- Pause/resume subscription
- Change delivery frequency
- Cancel subscription with confirmation

**Frequencies:**
- Weekly
- Every 2 weeks
- Monthly
- Every 2 months

### 8. Notification Preferences (`/profile/notifications`)
Control communication preferences.

**Categories:**
- **Orders:** Shipping confirmations, delivery notifications
- **Products:** Back-in-stock alerts, new blend announcements
- **Marketing:** Promotions, newsletter
- **Account:** Rewards updates, subscription reminders, security alerts

**Channels:**
- Email toggle
- SMS toggle (requires verified phone)

### 9. Flavor Profile (`/profile/flavor`)
Personalize taste preferences.

**Flavor Notes:**
- Floral, Fruity, Earthy, Spicy, Nutty
- Herbal, Sweet, Smoky, Bitter, Umami

**Caffeine Levels:**
- Caffeine-Free (herbal/decaf)
- Low (white/green teas)
- Moderate (oolong/light black)
- High (bold black/matcha)
- Any level

**Dietary Options:**
- Vegan, Gluten-Free, Nut-Free
- Dairy-Free, Organic Only, Fair Trade

**Personalization:**
- Generate product recommendations based on preferences
- Match percentage displayed for each recommendation

### 10. Apothecary Shelf (`/profile/apothecary`)
Visual collection of past purchases.

**Features:**
- "Jar" visualization for each unique product purchased
- Rarity system based on purchase frequency:
  - Common: 1-2 purchases
  - Uncommon: 3-5 purchases
  - Rare: 6-9 purchases
  - Legendary: 10+ purchases
- Filter by rarity
- Sort by recent, purchase count, or name
- Click jar for product details modal

**Visual Elements:**
- Animated glow for rare/legendary items
- Custom jar colors per product category
- Purchase count badge

### 11. Achievements (`/profile/achievements`)
Track badges and milestones.

**Categories:**
- **Purchases:** Order milestones, spending goals
- **Exploration:** Category diversity, reviews, wishlist
- **Loyalty:** Tier achievements, subscriptions
- **Seasonal:** Holiday-specific achievements
- **Special:** Early adopter, collector milestones

**Rarity Levels:**
- Common (gray)
- Uncommon (green)
- Rare (blue)
- Legendary (gold)

**Each Achievement Includes:**
- Name and icon
- Description
- Lore text (flavor text)
- Progress bar (if not earned)
- Earned date (if completed)

## Design System

### Color Palette
- **Background:** Slate-900 to Purple-950 gradient
- **Cards:** Slate-800/60 with backdrop blur
- **Accents:** Purple-400 to Purple-600
- **Success:** Green-400
- **Warning:** Amber-400
- **Error:** Red-400

### Typography
- Headers: Bold, white
- Body: Purple-200 to Purple-300
- Subtle text: Purple-300/60 to Purple-300/70
- Lore text: Italic, Purple-500/50

### Animations
- Card hover: Border glow transition
- Icons: Scale on hover
- Progress bars: Smooth width transitions
- Legendary items: Subtle pulse animation

### Pattern
- Subtle circular pattern overlay at 30% opacity
- Creates atmospheric depth

## Navigation

### Bottom Navigation
The profile system uses the existing bottom navigation with a link from the dashboard.

### Profile Internal Navigation
- Back link to profile dashboard on all sub-pages
- Navigation grid on dashboard for all sections
- Consistent header structure with icons

## Security Considerations

- Password validation (minimum 8 characters)
- Account deletion requires explicit confirmation
- Essential notifications cannot be fully disabled
- Payment methods handled via Stripe (no full card storage)

## Accessibility

- ARIA labels on toggle buttons
- Semantic heading structure
- Color contrast meets WCAG guidelines
- Interactive elements have visible focus states

## Future Enhancements

1. **API Integration:** Connect mock data to real backend endpoints
2. **Avatar Upload:** Implement actual file upload functionality
3. **Receipt Generation:** PDF generation for order receipts
4. **Real-time Notifications:** WebSocket for live updates
5. **Social Features:** Share achievements, friend referrals
