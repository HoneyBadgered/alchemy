/**
 * Migration script to move existing hardcoded articles to database
 * Run with: npm run migrate:articles
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Existing hardcoded articles from apps/web/src/data/articles.ts
const articles = [
  {
    slug: 'art-of-blending',
    title: 'The Art of Blending',
    excerpt: 'Learn the fundamentals of creating the perfect blend with our comprehensive guide to flavor combinations.',
    content: `📚

## Understanding Flavor Profiles

Every ingredient has its own unique flavor profile, comprising notes that can be categorized into several families: fruity, floral, nutty, spicy, earthy, and more. The key to successful blending is understanding how these profiles interact.

## The Rule of Threes

A classic approach to blending is the "Rule of Threes" — start with a base (60%), add a body (30%), and finish with an accent (10%). This creates a harmonious blend where each component has its role.

## Experimentation is Key

Don't be afraid to experiment! The best blends often come from unexpected combinations. Keep notes on your experiments, and you'll develop an intuition for what works.`,
    emoji: '📚',
    category: 'Guides',
    author: 'Master Alchemist',
    publishedAt: '2024-01-15',
    readTime: '5 min read',
  },
  {
    slug: 'coffee-origins',
    title: 'Coffee Origins Guide',
    excerpt: 'Explore the diverse world of coffee regions and discover how geography shapes flavor.',
    content: `🌍

## Ethiopian Origins

Ethiopia is considered the birthplace of coffee. Ethiopian beans are known for their fruity, wine-like qualities and complex floral notes. Regions like Yirgacheffe and Sidamo produce some of the world's most prized coffees.

## Colombian Coffee

Colombia's diverse microclimates produce balanced, sweet coffees with notes of caramel, nuts, and mild fruit. The country's commitment to quality has made "Colombian" synonymous with excellent coffee.

## Indonesian Varieties

Indonesia produces bold, earthy coffees with low acidity. Sumatra, Java, and Sulawesi offer unique profiles that are perfect for those who prefer full-bodied, complex blends.`,
    emoji: '🌍',
    category: 'Education',
    author: 'Bean Scholar',
    publishedAt: '2024-02-20',
    readTime: '7 min read',
  },
  {
    slug: 'tea-ceremony-basics',
    title: 'Tea Ceremony Basics',
    excerpt: 'Discover the mindful practice of tea preparation and the traditions behind the ceremony.',
    content: `🍵

## The Four Principles

Traditional tea ceremonies are built on four principles: Harmony (wa), Respect (kei), Purity (sei), and Tranquility (jaku). These guide every movement and decision during the ceremony.

## Essential Equipment

While you can start simple, traditional ceremonies use specific tools: a tea bowl (chawan), bamboo whisk (chasen), tea scoop (chashaku), and tea caddy (natsume). Each has its purpose and place.

## The Practice

Begin by preparing your space and mind. Warm your vessels, measure your tea, and heat your water to the appropriate temperature. The movements should be deliberate and graceful.`,
    emoji: '🍵',
    category: 'Wellness',
    author: 'Tea Master',
    publishedAt: '2024-03-10',
    readTime: '6 min read',
  },
  {
    slug: 'seasonal-blending',
    title: 'Seasonal Blending Guide',
    excerpt: 'Create blends that celebrate each season with ingredients at their peak.',
    content: `🍂

## Spring Awakening

Spring calls for light, refreshing blends with floral notes. Think jasmine, rose, and early harvest greens. These blends support renewal and cleansing.

## Summer Brightness

Summer is perfect for fruity, cooling blends. Hibiscus, citrus, and mint create refreshing options that can be enjoyed cold. Focus on hydration and energy.

## Autumn Warmth

As temperatures cool, reach for warming spices: cinnamon, ginger, cardamom, and clove. These create cozy blends perfect for crisp days.

## Winter Comfort

Winter calls for the deepest, richest blends. Dark roasts, chocolate notes, and robust spices provide comfort during the coldest months.`,
    emoji: '🍂',
    category: 'Seasonal',
    author: 'Seasonal Brewer',
    publishedAt: '2024-04-05',
    readTime: '5 min read',
  },
  {
    slug: 'equipment-guide',
    title: 'Essential Blending Equipment',
    excerpt: 'A complete guide to the tools you need to create professional-quality blends at home.',
    content: `🔧

## Measuring Tools

Precision matters in blending. A quality digital scale accurate to 0.1g is essential. Measuring spoons are helpful for quick recipes, but weight-based measurements are more consistent.

## Storage Solutions

Proper storage preserves your ingredients' freshness. Airtight containers, preferably amber or opaque to block light, are a must. Label everything with date and origin.

## Blending Vessels

Large bowls for mixing, smaller vessels for tasting, and dedicated containers for each blend help prevent cross-contamination of flavors.

## Brewing Equipment

Different blends require different brewing methods. Build a collection that includes pour-over, French press, tea infusers, and cold brew vessels.`,
    emoji: '🔧',
    category: 'Equipment',
    author: 'Tool Master',
    publishedAt: '2024-04-20',
    readTime: '6 min read',
  },
];

function calculateReadTime(body: string): string {
  const wordsPerMinute = 200;
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

async function main() {
  console.log('📚 Starting articles migration...\n');
  
  // Get admin user
  const admin = await prisma.users.findFirst({
    where: { role: 'admin' },
  });
  
  if (!admin) {
    console.error('❌ No admin user found. Please run seed script first.');
    process.exit(1);
  }
  
  console.log(`✅ Found admin user: ${admin.username}\n`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const article of articles) {
    // Check if post already exists
    const existing = await prisma.blog_posts.findUnique({
      where: { slug: article.slug },
    });
    
    if (existing) {
      console.log(`⏭️  Skipping "${article.title}" (already exists)`);
      skippedCount++;
      continue;
    }
    
    // Create post
    const post = await prisma.blog_posts.create({
      data: {
        id: randomUUID(),
        type: 'grimoire',
        title: article.title,
        slug: article.slug,
        body: article.content,
        excerpt: article.excerpt,
        category: article.category,
        status: 'published',
        isFeatured: false,
        authorId: admin.id,
        heroImageUrl: null,
        readTime: article.readTime,
        publishedAt: new Date(article.publishedAt),
        updatedAt: new Date(),
      },
    });
    
    console.log(`✅ Migrated "${article.title}"`);
    migratedCount++;
  }
  
  console.log(`\n📊 Migration complete!`);
  console.log(`   - Migrated: ${migratedCount}`);
  console.log(`   - Skipped: ${skippedCount}`);
  console.log(`   - Total: ${articles.length}\n`);
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
