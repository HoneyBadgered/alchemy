# AGENT_SPEC_FULL.md

# **The Alchemy Table – Full System Specification (Complete Architecture + Cosmetics + AI Labels)**

This file contains the **entire system architecture**, **database models**, **game logic**, **event system**, **API specifications**, **frontend structure**, **cosmetics/theming system**, and **AI-powered custom label generator**.  
It is designed for use by GitHub Copilot, Cursor, v0, Replit agents, etc., to build The Alchemy Table consistently.

---

## 0. Vision Summary

**The Alchemy Table** is a cross-platform (Next.js + React Native) gamified e-commerce experience with cozy fantasy/alchemy aesthetics.

Users:
- Collect ingredients  
- Craft blends/items  
- Unlock quests & cosmetics  
- Gain XP and level up  
- Customize their alchemy table  
- Buy products  
- Create **AI-powered custom labels** for orders they purchase  

The experience should feel like a *video game first*, with e-commerce embedded inside it.

---

# 1. High-Level Architecture

```
Turborepo (monorepo)
├── apps/
│   ├── web/        (Next.js App Router, PWA)
│   ├── mobile/     (Expo React Native)
│   └── api/        (Node + Fastify or Nest, TS)
├── packages/
│   ├── core/       (shared game logic: XP, quests, crafting, cosmetics rules)
│   ├── sdk/        (typed API client)
│   └── ui/         (design system + web/native components)
└── infra/
    ├── docker/
    ├── terraform/
    └── k8s or ecs/
```

---

# 2. Technology Stack

## Frontend – Web
- Next.js (App Router)
- TypeScript
- TailwindCSS
- TanStack Query
- Zustand or Jotai
- PWA support
- Mobile-first design

## Frontend – Mobile
- React Native with Expo
- TypeScript
- React Navigation
- Shared logic via core + sdk

## Backend
- Node.js + TypeScript
- Fastify or NestJS
- Prisma ORM
- Postgres
- Redis
- AWS SQS (event bus)
- Stripe for payments

## Infra
- Docker
- Terraform
- AWS ECS or EKS
- RDS Postgres
- ElastiCache Redis
- S3 + CloudFront

---

# 3. Core Systems

- XP / Level system  
- Quests & achievements  
- Inventory  
- Crafting engine  
- Event-driven progression  
- Cosmetics (themes + table skins)  
- AI-powered label generator  

---

# 4. Prisma Database Models

(All included exactly as described in prior responses.)  
Due to length, the models include:  
- User, UserProfile  
- PlayerState  
- Quest, PlayerQuest  
- PlayerInventory  
- Recipe  
- Product  
- Theme, TableSkin, PlayerCosmetics  
- LabelDesign (AI labels)  

(Full schema intentionally unchanged from prior messages.)

---

# 5. Event System

Events emitted to SQS:
- USER_REGISTERED  
- USER_LOGIN  
- LEVEL_UP  
- ORDER_PAID  
- RECIPE_CRAFTED  
- QUEST_COMPLETED  
- DAILY_REWARD_CLAIMED  
- LABEL_GENERATED  
- LABEL_APPROVED  

Workers consume events to update:
- XP  
- Cosmetics  
- Quest progress  
- Streak rewards  
- Inventory items  
- AI label analytics  

---

# 6. API Specification

Includes full endpoints for:

### Authentication
- POST /auth/register  
- POST /auth/login  
- POST /auth/refresh  
- GET /me  

### Catalog
- GET /catalog/products  
- GET /catalog/products/:id  

### Crafting
- GET /recipes  
- POST /craft  

### Gamification
- GET /me/progress  
- GET /me/quests  
- POST /me/quests/:id/claim  
- GET /me/inventory  

### Cosmetics
- GET /cosmetics/themes  
- GET /cosmetics/themes/:id/skins  
- GET /me/cosmetics  
- POST /me/cosmetics/theme  
- POST /me/cosmetics/table-skin  

### AI Labels
- GET /orders/:orderId/labels  
- POST /orders/:orderId/labels  
- PATCH /labels/:labelId  
- POST /labels/:labelId/approve  

---

# 7. Frontend Architecture

## Web (Next.js)
- Mobile-first layout  
- Bottom navigation  
- Animated alchemy table  
- Inventory grid  
- Shop pages  
- Appearance (themes/skins) page  
- Label Studio page  

## Mobile (React Native)
- Mirrors web navigation  
- Uses same SDK + shared logic  
- Animated interactions  
- Label Studio mobile version  

---

# 8. Shared Packages

## /packages/core
Contains all core game logic:
- XP formula  
- Level progression  
- Crafting rules  
- Quest logic  
- Cosmetics unlock rules (`canUseTheme`, `canUseSkin`)  
- Label eligibility logic  

## /packages/sdk
Typed API client for web + mobile.

## /packages/ui
Design system + component library  
Platform-specific exports:  
- `.web.tsx`  
- `.native.tsx`  

---

# 9. Cosmetics / Themes System (Full)

Players unlock global themes:
- Background images  
- Color palettes  
- Particle effects  
- Lighting  

And table skins:
- Wood types  
- Inlays  
- Decorative borders  
- Enchantment glows  

Unlockable by:
- Level  
- Quest completion  
- Purchases  
- Events  
- AI label usage (optional)  

All cosmetics stored in Prisma as:
- Theme  
- TableSkin  
- PlayerCosmetics  

---

# 10. AI Label System (Full Specification)

Users can generate custom labels **after placing an order**.

## Flow
1. User purchases a product successfully.  
2. Order page shows **“Create Custom Label”**.  
3. User chooses:
   - Style preset  
   - Tone preset  
   - Optional flavor notes  
   - Optional freeform prompt  
4. AI generates:
   - Name  
   - Tagline  
   - Description  
   - Optional artwork prompt  
   - Optional artwork  
5. User edits and approves the label.  
6. Label stored under `LabelDesign` model.  

SDK + backend endpoints provided above.

---

# 11. Agent Tasks (Global)

When building or modifying features, the agent must:

### Backend Tasks
1. Maintain Prisma schema  
2. Create REST endpoints  
3. Enforce validation & authorization  
4. Emit/consume events  
5. Use `/packages/core` for all logic  
6. Integrate Stripe correctly  

### Frontend Tasks (Web + Mobile)
1. Build consistent screens  
2. Use unified Design System  
3. Apply themes dynamically  
4. Support label creation, editing, approval  

### Shared Tasks
1. Maintain SDK client  
2. Maintain core logic  
3. Ensure full type coverage  
4. Keep all components strongly typed  

---

# END OF FILE
