# Alchemy CMS Documentation

This document describes the Content Management System (CMS) implementation for The Alchemy Table monorepo.

## Overview

The CMS manages two types of content:
- **Log Book** (short-form blog posts)
- **Grimoire** (long-form articles/guides)

All content is displayed in the `/library` section of the website.

## Architecture

### Tech Stack
- **Backend**: Fastify + Prisma + PostgreSQL
- **Frontend**: Next.js 16 (App Router)
- **SDK**: TypeScript client library
- **Markdown**: react-markdown with remark-gfm

### Database Schema

**blog_posts**
- Primary table for all content
- `type` field distinguishes 'log' vs 'grimoire'
- `slug` is unique and permanent once created
- `status` workflow: draft → published
- Soft deletes via `deletedAt` timestamp
- `isFeatured` flag for highlighting content

**tags**
- Case-insensitive tag names
- Auto-generated slugs
- Many-to-many with posts (max 10 per post)

**blog_post_tags**
- Junction table for post-tag relationships
- Cascade deletes

## Getting Started

### 1. Database Setup

```bash
cd apps/api

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 2. Migrate Existing Articles

```bash
cd apps/api
npm run migrate:articles
```

This will migrate the 5 hardcoded articles from `apps/web/src/data/articles.ts` to the database.

### 3. Environment Variables

Create `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Start Development Servers

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

## Admin Dashboard

Access: `/admin/blog` (requires admin role)

### Pages

**All Posts** (`/admin/blog`)
- List view with filtering by type, status, category
- Search functionality
- Pagination
- Actions: Edit, Publish/Unpublish, Toggle Featured, Delete

**New Post** (`/admin/blog/new?type=log|grimoire`)
- Create new log entries or grimoire articles
- Markdown editor (textarea-based)
- Tag selection (max 10)
- Category selection (required for grimoire)
- Save as Draft or Save & Publish

**Edit Post** (`/admin/blog/[id]`)
- Update existing posts
- Cannot change slug (permanent)
- All other fields editable

**Tags Management** (`/admin/blog/tags`)
- Create, update, delete tags
- View post counts
- Cannot delete tags in use

**Statistics** (`/admin/blog/stats`)
- Total posts, published, drafts, featured
- Posts by type (log/grimoire)
- Posts by category

## Public Library

Access: `/library`

### Features

- **Type Filter**: All / Log Book / Grimoire
- **Category Filter**: All categories or specific
- **Search**: Full-text search on titles and excerpts
- **Featured Posts**: Highlighted at top when available
- **Post Cards**: Display title, excerpt, category, tags, read time
- **Pagination**: Load more functionality

### Post Detail Pages

URL: `/library/[type]/[slug]`

- Full markdown rendering
- Breadcrumb navigation
- Author information
- Published date and read time
- Tags (clickable chips)
- Related posts section (3 posts with same tags/category)

## API Endpoints

### Public Endpoints (No Auth)

```
GET  /blog/posts                 - List published posts
GET  /blog/posts/:slug            - Get single post by slug (requires ?type=log|grimoire)
GET  /blog/featured               - Get featured posts
GET  /blog/categories             - Get all categories
GET  /blog/tags                   - Get all tags with post counts
GET  /blog/tags/:slug/posts       - Get posts by tag
GET  /blog/search                 - Search posts (requires ?q=query)
GET  /blog/posts/:id/related      - Get related posts
```

### Admin Endpoints (Require Auth + Admin Role)

```
GET    /admin/blog/posts          - List all posts (with filters)
GET    /admin/blog/posts/:id      - Get single post
POST   /admin/blog/posts          - Create new post
PATCH  /admin/blog/posts/:id      - Update post
DELETE /admin/blog/posts/:id      - Soft delete post
POST   /admin/blog/posts/:id/restore        - Restore deleted post
POST   /admin/blog/posts/:id/publish        - Publish post
POST   /admin/blog/posts/:id/unpublish      - Unpublish post
POST   /admin/blog/posts/:id/toggle-featured - Toggle featured flag

GET    /admin/blog/tags           - List all tags
POST   /admin/blog/tags           - Create tag
PATCH  /admin/blog/tags/:id       - Update tag
DELETE /admin/blog/tags/:id       - Delete tag

GET    /admin/blog/stats          - Get statistics
```

## SDK Usage

```typescript
import { AlchemyClient } from '@alchemy/sdk';

const client = new AlchemyClient({
  baseURL: 'http://localhost:4000',
  accessToken: 'your-jwt-token', // For admin endpoints
});

// Public methods
const posts = await client.blog.getPosts({ type: 'grimoire', perPage: 12 });
const post = await client.blog.getPost('my-slug', 'grimoire');
const featured = await client.blog.getFeaturedPosts(3);

// Admin methods (require auth)
const newPost = await client.blog.createPost({
  type: 'log',
  title: 'My First Post',
  body: '# Hello World\n\nThis is my first post!',
  status: 'draft',
});

await client.blog.publishPost(newPost.id);
```

## Categories

**Grimoire-focused**
- Guides
- Techniques
- Recipes
- Equipment
- Wellness
- Seasonal
- Education

**Log-friendly**
- Updates
- Announcements
- Events
- Community

Category is **required** for grimoire posts, **optional** for log posts.

## Slug Generation

- Auto-generated from title
- Lowercase, alphanumeric + hyphens only
- Collisions handled with numeric suffix (e.g., `my-post-2`)
- **Permanent once created** (cannot be changed)

## Read Time Calculation

- Calculated at 200 words per minute
- Auto-updated when body changes
- Format: "X min read"

## Tag Normalization

- Stored as lowercase
- Whitespace trimmed
- Multiple spaces collapsed
- Displayed in Title Case in UI
- Slug auto-generated: lowercase with hyphens

## Markdown Support

Powered by react-markdown with remark-gfm plugin:
- Headings (H1-H6)
- Lists (ordered/unordered)
- Code blocks with syntax highlighting
- Tables
- Blockquotes
- Images
- Links
- Bold, italic, strikethrough
- Task lists

## Security Features

- JWT authentication for admin endpoints
- Admin role verification
- Zod validation on all inputs
- SQL injection protection via Prisma
- XSS protection via markdown sanitization
- Rate limiting on API
- CORS restricted to frontend domain

## Performance Optimizations

- Pagination on list views
- Related posts limited to 3
- Soft deletes (no hard deletes)
- Indexed columns: type, status, slug, publishedAt, category, isFeatured
- API responses include only necessary data

## Troubleshooting

### "Module not found: @alchemy/sdk"
```bash
cd packages/core && npm run build
cd packages/sdk && npm run build
```

### "Cannot reach database server"
Check DATABASE_URL in `apps/api/.env` and ensure PostgreSQL is running.

### "Unauthorized" errors
Ensure you're logged in as admin and access token is valid.

### Slugs not generating
Check that title contains alphanumeric characters. Emoji-only titles won't generate slugs.

## Future Enhancements

Potential improvements not included in this implementation:
- Rich text WYSIWYG editor (e.g., TipTap, Slate)
- Image upload and management
- Post scheduling (publish at specific time)
- Draft preview with shareable links
- Post revisions/version history
- Comments system
- Post analytics (views, time on page)
- RSS feed generation
- SEO metadata editor
- Bulk operations (bulk publish, bulk delete)
- Post duplication
- Import/export functionality
- Multi-author support with permissions

## File Structure

```
apps/
  api/
    prisma/
      schema.prisma                    # Database schema
      migrations/                      # Database migrations
    scripts/
      migrate-articles-to-db.ts        # Migration script
    src/
      routes/
        admin-blog.routes.ts           # Admin endpoints
        blog.routes.ts                 # Public endpoints
      services/
        admin-blog.service.ts          # Business logic
  web/
    src/
      app/
        admin/
          blog/
            page.tsx                   # Blog list
            new/page.tsx               # Create post
            [id]/page.tsx              # Edit post
            tags/page.tsx              # Tags management
            stats/page.tsx             # Statistics
        library/
          page.tsx                     # Public library list
          [type]/[slug]/page.tsx       # Post detail
      components/
        blog/
          MarkdownContent.tsx          # Markdown renderer
packages/
  core/
    src/
      types/
        blog.ts                        # TypeScript types
  sdk/
    src/
      endpoints/
        blog.ts                        # SDK endpoints
```

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check the database schema
4. Open an issue on GitHub
