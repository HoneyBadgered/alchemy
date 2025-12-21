/**
 * Search Service
 * Provides unified search across products, blog posts, and other content
 */

import { prisma } from '../utils/prisma';

export interface SearchResult {
  id: string;
  type: 'product' | 'article' | 'page';
  title: string;
  description: string;
  url: string;
  image?: string;
  score?: number;
}

export interface SearchParams {
  query: string;
  limit?: number;
  types?: ('product' | 'article' | 'page')[];
}

export class SearchService {
  /**
   * Search across products, blog posts, and static pages
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    const { query, limit = 20, types } = params;
    const results: SearchResult[] = [];

    if (!query || query.trim().length < 2) {
      return results;
    }

    const lowerQuery = query.toLowerCase();
    const searchTypes = types || ['product', 'article', 'page'];

    // Search products
    if (searchTypes.includes('product')) {
      const products = await this.searchProducts(lowerQuery, limit);
      results.push(...products);
    }

    // Search blog posts
    if (searchTypes.includes('article')) {
      const articles = await this.searchArticles(lowerQuery, limit);
      results.push(...articles);
    }

    // Add static pages
    if (searchTypes.includes('page')) {
      const pages = this.searchStaticPages(lowerQuery);
      results.push(...pages);
    }

    // Sort by relevance score and limit total results
    return results
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }

  /**
   * Search products by name, description, tags
   */
  private async searchProducts(query: string, limit: number): Promise<SearchResult[]> {
    const products = await prisma.products.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
            ],
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
      },
    });

    return products.map((product: any) => {
      // Calculate relevance score
      const nameMatch = product.name.toLowerCase().includes(query);
      const exactMatch = product.name.toLowerCase() === query;
      const score = exactMatch ? 100 : nameMatch ? 75 : 50;

      return {
        id: product.id,
        type: 'product' as const,
        title: product.name,
        description: product.description || '',
        url: `/shop/${product.id}`,
        image: product.images?.[0] || undefined,
        score,
      };
    });
  }

  /**
   * Search blog posts by title, excerpt, content
   */
  private async searchArticles(query: string, limit: number): Promise<SearchResult[]> {
    const posts = await prisma.blog_posts.findMany({
      where: {
        AND: [
          { status: 'published' },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { excerpt: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
            ],
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
      },
    });

    return posts.map((post: any) => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const exactMatch = post.title.toLowerCase() === query;
      const score = exactMatch ? 100 : titleMatch ? 80 : 60;

      return {
        id: post.id,
        type: 'article' as const,
        title: post.title,
        description: post.excerpt || '',
        url: `/blog/${post.slug}`,
        image: post.featuredImage || undefined,
        score,
      };
    });
  }

  /**
   * Search static pages
   */
  private searchStaticPages(query: string): SearchResult[] {
    const staticPages = [
      {
        id: 'about',
        title: 'About Us',
        description: 'Learn about The Alchemy Table and our mission',
        url: '/about',
        keywords: ['about', 'mission', 'story', 'company', 'team'],
      },
      {
        id: 'contact',
        title: 'Contact',
        description: 'Get in touch with our team',
        url: '/contact',
        keywords: ['contact', 'email', 'support', 'help', 'reach'],
      },
      {
        id: 'faq',
        title: 'FAQ',
        description: 'Frequently asked questions',
        url: '/faq',
        keywords: ['faq', 'questions', 'help', 'support', 'answers'],
      },
      {
        id: 'library',
        title: 'Library',
        description: 'Educational resources and guides',
        url: '/library',
        keywords: ['library', 'learn', 'education', 'guides', 'resources'],
      },
      {
        id: 'table',
        title: 'Create a Blend',
        description: 'Design your custom tea or coffee blend',
        url: '/table',
        keywords: ['blend', 'create', 'custom', 'mix', 'craft', 'table'],
      },
      {
        id: 'games',
        title: 'Mini Games',
        description: 'Play games to earn XP and rewards',
        url: '/games',
        keywords: ['games', 'play', 'xp', 'rewards', 'fun'],
      },
    ];

    return staticPages
      .filter((page) => {
        const titleMatch = page.title.toLowerCase().includes(query);
        const descMatch = page.description.toLowerCase().includes(query);
        const keywordMatch = page.keywords.some((kw) => kw.includes(query));
        return titleMatch || descMatch || keywordMatch;
      })
      .map((page) => {
        const titleMatch = page.title.toLowerCase().includes(query);
        const exactMatch = page.title.toLowerCase() === query;
        const score = exactMatch ? 95 : titleMatch ? 70 : 40;

        return {
          id: page.id,
          type: 'page' as const,
          title: page.title,
          description: page.description,
          url: page.url,
          score,
        };
      });
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    // Get product names
    const products = await prisma.products.findMany({
      where: {
        isActive: true,
        name: { contains: lowerQuery, mode: 'insensitive' },
      },
      take: limit,
      select: { name: true },
    });

    return products.map((p: any) => p.name);
  }
}
