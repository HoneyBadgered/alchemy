# Theming Guide for The Alchemy Table

This guide shows developers how to use the site's theming system to ensure consistent styling across all pages.

## Overview

The application uses **CSS custom properties (variables)** for theming, defined in `src/app/globals.css`. This approach enables:
- Dynamic theme switching (verdant green, purple, crimson, admin)
- Better performance (no JavaScript required)
- Easy maintenance (single source of truth)

## Available Themes

Users can switch between themes via `/appearance`:

1. **Verdant Elixir Botanical Noir** (default) - Deep forest green theme
2. **Purple Magical** - Original mystical purple theme
3. **Crimson Ritual** - Dark red/crimson theme
4. **Admin** - Clean white/purple professional theme (auto-applied to `/admin/**` routes)

## CSS Variables Reference

### Colors

Use these variables for all color values:

```css
var(--primary)         /* Primary brand color (green/purple/red depending on theme) */
var(--primary-hover)   /* Darker shade for hover states */
var(--secondary)       /* Secondary color for accents */
var(--background)      /* Page background color */
var(--surface)         /* Card/panel background color */
var(--text-base)       /* Primary text color */
var(--text-muted)      /* Secondary/muted text color */
var(--accent)          /* Accent color (gold in most themes) */
var(--accent-hover)    /* Darker accent for hover states */
```

### Typography

```css
var(--font-serif)      /* Cormorant Garamond - for headings */
var(--font-sans)       /* Inter - for body text */
```

## Utility Classes

Instead of writing custom CSS, use these pre-built utility classes:

### Buttons

```tsx
{/* Primary button - uses theme primary color */}
<button className="btn-primary">Click Me</button>

{/* Secondary button - uses theme secondary color */}
<button className="btn-secondary">Secondary</button>

{/* Outline button - transparent with border */}
<button className="btn-outline">Outline</button>

{/* Ornate gold button - for special actions */}
<button className="ornate-button">Craft Blend</button>

{/* Ornate outline button */}
<button className="ornate-button-outline">Learn More</button>
```

### Cards

```tsx
{/* Elevated card with theme-aware background */}
<div className="card-elevated">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>
```

### Form Inputs

```tsx
{/* Theme-aware input field */}
<input 
  type="text" 
  className="input-themed" 
  placeholder="Enter text..."
/>
```

### Badges

```tsx
{/* Primary badge */}
<span className="badge-primary">New</span>

{/* Accent badge (gold) */}
<span className="badge-accent">Featured</span>
```

### Links

```tsx
{/* Theme-aware link with hover effect */}
<a href="/shop" className="link-primary">
  Browse Products
</a>
```

## Common Patterns

### 1. Buttons with Theme Colors

❌ **Don't do this:**
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white">
  Click Me
</button>
```

✅ **Do this instead:**
```tsx
<button className="btn-primary">
  Click Me
</button>

{/* Or use CSS variables directly: */}
<button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
  Click Me
</button>
```

### 2. Text Colors

❌ **Don't do this:**
```tsx
<h1 className="text-purple-900">Welcome</h1>
<p className="text-gray-600">Description</p>
```

✅ **Do this instead:**
```tsx
<h1 className="text-[var(--text-base)]">Welcome</h1>
<p className="text-[var(--text-muted)]">Description</p>
```

### 3. Backgrounds

❌ **Don't do this:**
```tsx
<div className="bg-gradient-to-b from-purple-50 to-pink-50">
  Content
</div>
```

✅ **Do this instead:**
```tsx
<div className="bg-[var(--background)]">
  Content
</div>

{/* For elevated surfaces: */}
<div className="bg-[var(--surface)]">
  Content
</div>
```

### 4. Borders and Focus States

```tsx
{/* Input with theme-aware focus ring */}
<input 
  className="border border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
/>

{/* Card with theme-aware border */}
<div className="border-2 border-[var(--primary)] rounded-lg">
  Selected Item
</div>
```

## When NOT to Use Theme Variables

Some elements should maintain consistent colors across all themes:

- **Error states**: Use standard red colors (`text-red-600`, `bg-red-50`)
- **Success states**: Use standard green colors (`text-green-600`, `bg-green-50`)
- **Warning states**: Use standard yellow/orange colors
- **Game-specific UI**: Games in `/games/**` can use custom colors
- **Admin section**: Automatically uses admin theme (no changes needed)

## Migration Checklist

When updating an existing page to use the theme system:

- [ ] Replace hardcoded purple colors (`purple-100` through `purple-900`) with theme variables
- [ ] Replace hardcoded green colors with theme variables
- [ ] Replace custom button styles with utility classes (`.btn-primary`, etc.)
- [ ] Replace `bg-white` with `bg-[var(--surface)]` for cards/panels
- [ ] Replace `text-gray-900` with `text-[var(--text-base)]` for primary text
- [ ] Replace `text-gray-600` with `text-[var(--text-muted)]` for secondary text
- [ ] Test the page with all 4 themes via `/appearance`

## Testing Themes

1. Navigate to `/appearance` (or use the appearance settings)
2. Switch between all 4 themes
3. Verify that your page looks good in each theme
4. Check that interactive elements (buttons, links, inputs) use theme colors

## File Locations

- **Theme definitions**: `apps/web/src/app/globals.css` (lines 95-160)
- **Utility classes**: `apps/web/src/app/globals.css` (lines 95-222)
- **Theme switcher**: `apps/web/src/contexts/ThemeContext.tsx`
- **Appearance page**: `apps/web/src/app/appearance/page.tsx`

## Need Help?

- Check `globals.css` for the complete list of CSS variables
- Look at recently updated pages (login, signup, wishlist) for examples
- Reference the alchemy table components for complex theming patterns

---

**Last Updated**: January 19, 2026
