/**
 * Search Service Tests
 */

import { SearchService } from '../services/search.service';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../../utils/prisma', () => ({
  prisma: {
    products: {
      findMany: jest.fn(),
    },
    blog_posts: {
      findMany: jest.fn(),
    },
  },
}));

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return empty results for queries less than 2 characters', async () => {
      const results = await searchService.search({ query: 'a' });
      expect(results).toEqual([]);
      expect(prisma.products.findMany).not.toHaveBeenCalled();
    });

    it('should search products successfully', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Lavender Tea',
          description: 'Calming herbal tea',
          images: ['lavender.jpg'],
        },
      ];

      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.blog_posts.findMany as jest.Mock).mockResolvedValue([]);

      const results = await searchService.search({ query: 'lavender' });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'prod-1',
        type: 'product',
        title: 'Lavender Tea',
        description: 'Calming herbal tea',
        url: '/shop/prod-1',
        image: 'lavender.jpg',
      });
    });

    it('should search blog posts successfully', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          slug: 'tea-guide',
          title: 'Tea Brewing Guide',
          excerpt: 'Learn to brew perfect tea',
          featuredImage: 'tea.jpg',
        },
      ];

      (prisma.products.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.blog_posts.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const results = await searchService.search({ query: 'tea' });

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'post-1',
        type: 'article',
        title: 'Tea Brewing Guide',
        url: '/blog/tea-guide',
      });
    });

    it('should search static pages', async () => {
      (prisma.products.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.blog_posts.findMany as jest.Mock).mockResolvedValue([]);

      const results = await searchService.search({ query: 'about' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('page');
      expect(results[0].title).toBe('About Us');
    });

    it('should limit results correctly', async () => {
      const mockProducts = Array.from({ length: 30 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product ${i}`,
        description: 'Test product',
        images: [],
      }));

      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (prisma.blog_posts.findMany as jest.Mock).mockResolvedValue([]);

      const results = await searchService.search({ query: 'product', limit: 10 });

      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should filter by type', async () => {
      (prisma.products.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.blog_posts.findMany as jest.Mock).mockResolvedValue([]);

      const results = await searchService.search({
        query: 'about',
        types: ['page'],
      });

      expect(results.every((r: any) => r.type === 'page')).toBe(true);
      expect(prisma.products.findMany).not.toHaveBeenCalled();
      expect(prisma.blog_posts.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getSuggestions', () => {
    it('should return empty for short queries', async () => {
      const suggestions = await searchService.getSuggestions('a');
      expect(suggestions).toEqual([]);
    });

    it('should return product name suggestions', async () => {
      const mockProducts = [
        { name: 'Lavender Tea' },
        { name: 'Lavender Blend' },
      ];

      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const suggestions = await searchService.getSuggestions('lav');

      expect(suggestions).toEqual(['Lavender Tea', 'Lavender Blend']);
    });

    it('should limit suggestions', async () => {
      const mockProducts = Array.from({ length: 10 }, (_, i) => ({
        name: `Product ${i}`,
      }));

      (prisma.products.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const suggestions = await searchService.getSuggestions('prod', 3);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });
});
