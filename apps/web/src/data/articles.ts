/**
 * Static data for library articles.
 * In production, this would come from a CMS or API.
 */

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
}

export const articles: Article[] = [
  {
    slug: 'art-of-blending',
    title: 'The Art of Blending',
    excerpt: 'Learn the fundamentals of creating the perfect blend with our comprehensive guide to flavor combinations.',
    content: `
      <p>The art of blending is a centuries-old craft that combines science, intuition, and creativity. Whether you're working with coffee, tea, or herbs, the principles remain the same: balance, harmony, and intention.</p>
      
      <h2>Understanding Flavor Profiles</h2>
      <p>Every ingredient has its own unique flavor profile, comprising notes that can be categorized into several families: fruity, floral, nutty, spicy, earthy, and more. The key to successful blending is understanding how these profiles interact.</p>
      
      <h2>The Rule of Threes</h2>
      <p>A classic approach to blending is the "Rule of Threes" — start with a base (60%), add a body (30%), and finish with an accent (10%). This creates a harmonious blend where each component has its role.</p>
      
      <h2>Experimentation is Key</h2>
      <p>Don't be afraid to experiment! The best blends often come from unexpected combinations. Keep notes on your experiments, and you'll develop an intuition for what works.</p>
    `,
    image: '📚',
    category: 'Guides',
    author: 'Master Alchemist',
    publishedAt: '2024-01-15',
    readTime: '5 min read',
  },
  {
    slug: 'coffee-origins',
    title: 'Coffee Origins Guide',
    excerpt: 'Explore the diverse world of coffee regions and discover how geography shapes flavor.',
    content: `
      <p>Coffee is grown in what's known as the "Coffee Belt" — a region between the Tropics of Cancer and Capricorn. Each origin brings unique characteristics shaped by altitude, soil, and climate.</p>
      
      <h2>Ethiopian Origins</h2>
      <p>Ethiopia is considered the birthplace of coffee. Ethiopian beans are known for their fruity, wine-like qualities and complex floral notes. Regions like Yirgacheffe and Sidamo produce some of the world's most prized coffees.</p>
      
      <h2>Colombian Coffee</h2>
      <p>Colombia's diverse microclimates produce balanced, sweet coffees with notes of caramel, nuts, and mild fruit. The country's commitment to quality has made "Colombian" synonymous with excellent coffee.</p>
      
      <h2>Indonesian Varieties</h2>
      <p>Indonesia produces bold, earthy coffees with low acidity. Sumatra, Java, and Sulawesi offer unique profiles that are perfect for those who prefer full-bodied, complex blends.</p>
    `,
    image: '🌍',
    category: 'Education',
    author: 'Bean Scholar',
    publishedAt: '2024-02-20',
    readTime: '7 min read',
  },
  {
    slug: 'tea-ceremony-basics',
    title: 'Tea Ceremony Basics',
    excerpt: 'Discover the mindful practice of tea preparation and the traditions behind the ceremony.',
    content: `
      <p>The tea ceremony is more than just making tea — it's a meditative practice that brings mindfulness to the everyday act of brewing and drinking. Let's explore the basics.</p>
      
      <h2>The Four Principles</h2>
      <p>Traditional tea ceremonies are built on four principles: Harmony (wa), Respect (kei), Purity (sei), and Tranquility (jaku). These guide every movement and decision during the ceremony.</p>
      
      <h2>Essential Equipment</h2>
      <p>While you can start simple, traditional ceremonies use specific tools: a tea bowl (chawan), bamboo whisk (chasen), tea scoop (chashaku), and tea caddy (natsume). Each has its purpose and place.</p>
      
      <h2>The Practice</h2>
      <p>Begin by preparing your space and mind. Warm your vessels, measure your tea, and heat your water to the appropriate temperature. The movements should be deliberate and graceful.</p>
    `,
    image: '🍵',
    category: 'Traditions',
    author: 'Tea Master',
    publishedAt: '2024-03-10',
    readTime: '6 min read',
  },
  {
    slug: 'herbal-alchemy',
    title: 'Introduction to Herbal Alchemy',
    excerpt: 'Unlock the healing potential of herbs and learn to create therapeutic blends.',
    content: `
      <p>Herbal alchemy combines ancient wisdom with modern understanding to create blends that nourish body and soul. This guide introduces you to the fascinating world of therapeutic botanicals.</p>
      
      <h2>Understanding Herbal Actions</h2>
      <p>Herbs are categorized by their actions: adaptogens help with stress, nervines calm the nervous system, digestives aid digestion, and tonics strengthen overall health. Understanding these categories helps you create targeted blends.</p>
      
      <h2>Popular Healing Herbs</h2>
      <p>Chamomile for relaxation, peppermint for digestion, echinacea for immunity, and lavender for calm — these are just a few of the herbs you'll want in your apothecary.</p>
      
      <h2>Safety First</h2>
      <p>Always research herbs before using them, especially if you're pregnant, nursing, or taking medications. Start with small amounts and observe how your body responds.</p>
    `,
    image: '🌿',
    category: 'Wellness',
    author: 'Herbalist Sage',
    publishedAt: '2024-03-25',
    readTime: '8 min read',
  },
  {
    slug: 'seasonal-blending',
    title: 'Seasonal Blending Guide',
    excerpt: 'Create blends that celebrate each season with ingredients at their peak.',
    content: `
      <p>Nature provides different gifts throughout the year, and seasonal blending honors this rhythm. Learn to create blends that complement each season's energy and available ingredients.</p>
      
      <h2>Spring Awakening</h2>
      <p>Spring calls for light, refreshing blends with floral notes. Think jasmine, rose, and early harvest greens. These blends support renewal and cleansing.</p>
      
      <h2>Summer Brightness</h2>
      <p>Summer is perfect for fruity, cooling blends. Hibiscus, citrus, and mint create refreshing options that can be enjoyed cold. Focus on hydration and energy.</p>
      
      <h2>Autumn Warmth</h2>
      <p>As temperatures cool, reach for warming spices: cinnamon, ginger, cardamom, and clove. These create cozy blends perfect for crisp days.</p>
      
      <h2>Winter Comfort</h2>
      <p>Winter calls for the deepest, richest blends. Dark roasts, chocolate notes, and robust spices provide comfort during the coldest months.</p>
    `,
    image: '🍂',
    category: 'Seasonal',
    author: 'Seasonal Brewer',
    publishedAt: '2024-04-05',
    readTime: '5 min read',
  },
  {
    slug: 'equipment-guide',
    title: 'Essential Blending Equipment',
    excerpt: 'A complete guide to the tools you need to create professional-quality blends at home.',
    content: `
      <p>While great blends can be made with basic equipment, having the right tools elevates your craft. Here's what every aspiring alchemist needs.</p>
      
      <h2>Measuring Tools</h2>
      <p>Precision matters in blending. A quality digital scale accurate to 0.1g is essential. Measuring spoons are helpful for quick recipes, but weight-based measurements are more consistent.</p>
      
      <h2>Storage Solutions</h2>
      <p>Proper storage preserves your ingredients' freshness. Airtight containers, preferably amber or opaque to block light, are a must. Label everything with date and origin.</p>
      
      <h2>Blending Vessels</h2>
      <p>Large bowls for mixing, smaller vessels for tasting, and dedicated containers for each blend help prevent cross-contamination of flavors.</p>
      
      <h2>Brewing Equipment</h2>
      <p>Different blends require different brewing methods. Build a collection that includes pour-over, French press, tea infusers, and cold brew vessels.</p>
    `,
    image: '🔧',
    category: 'Equipment',
    author: 'Tool Master',
    publishedAt: '2024-04-20',
    readTime: '6 min read',
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesByCategory(category: string): Article[] {
  return articles.filter((article) => article.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(articles.map((article) => article.category))];
}
