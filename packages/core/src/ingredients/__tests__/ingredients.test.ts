/**
 * Tests for ingredients data and utilities
 */

import {
  INGREDIENTS,
  CATEGORY_INFO,
  getIngredientsByCategory,
  getIngredientById,
  getBaseTeas,
  getAddIns,
} from '../index';

describe('Ingredients', () => {
  describe('INGREDIENTS', () => {
    it('should have ingredients defined', () => {
      expect(INGREDIENTS).toBeDefined();
      expect(INGREDIENTS.length).toBeGreaterThan(0);
    });

    it('should have all required properties for each ingredient', () => {
      INGREDIENTS.forEach(ingredient => {
        expect(ingredient).toHaveProperty('id');
        expect(ingredient).toHaveProperty('name');
        expect(ingredient).toHaveProperty('category');
        expect(ingredient).toHaveProperty('isBase');
        expect(typeof ingredient.id).toBe('string');
        expect(typeof ingredient.name).toBe('string');
        expect(typeof ingredient.category).toBe('string');
        expect(typeof ingredient.isBase).toBe('boolean');
      });
    });

    it('should have unique ingredient IDs', () => {
      const ids = INGREDIENTS.map(ing => ing.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have base teas with isBase=true', () => {
      const baseTeas = INGREDIENTS.filter(ing => ing.category === 'base');
      baseTeas.forEach(tea => {
        expect(tea.isBase).toBe(true);
      });
    });

    it('should have add-ins with isBase=false', () => {
      const addIns = INGREDIENTS.filter(ing => ing.category !== 'base');
      addIns.forEach(addIn => {
        expect(addIn.isBase).toBe(false);
      });
    });
  });

  describe('CATEGORY_INFO', () => {
    it('should have info for all categories', () => {
      const categories = ['base', 'floral', 'fruit', 'herbal', 'spice', 'special'];
      categories.forEach(category => {
        expect(CATEGORY_INFO).toHaveProperty(category);
        expect(CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]).toHaveProperty('title');
        expect(CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]).toHaveProperty('description');
        expect(CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]).toHaveProperty('emoji');
        expect(CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]).toHaveProperty('color');
      });
    });
  });

  describe('getIngredientsByCategory', () => {
    it('should return base teas for base category', () => {
      const baseTeas = getIngredientsByCategory('base');
      expect(baseTeas.length).toBeGreaterThan(0);
      baseTeas.forEach(tea => {
        expect(tea.category).toBe('base');
        expect(tea.isBase).toBe(true);
      });
    });

    it('should return floral ingredients', () => {
      const florals = getIngredientsByCategory('floral');
      expect(florals.length).toBeGreaterThan(0);
      florals.forEach(ing => {
        expect(ing.category).toBe('floral');
        expect(ing.isBase).toBe(false);
      });
    });

    it('should return ingredients for all categories', () => {
      const categories = ['base', 'floral', 'fruit', 'herbal', 'spice', 'special'];
      categories.forEach(category => {
        const ingredients = getIngredientsByCategory(category as any);
        expect(ingredients.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getIngredientById', () => {
    it('should return ingredient by ID', () => {
      const greenTea = getIngredientById('green-tea');
      expect(greenTea).toBeDefined();
      expect(greenTea?.id).toBe('green-tea');
      expect(greenTea?.name).toBe('Green Tea');
    });

    it('should return undefined for non-existent ID', () => {
      const result = getIngredientById('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should find all ingredients by their IDs', () => {
      INGREDIENTS.forEach(ingredient => {
        const found = getIngredientById(ingredient.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(ingredient.id);
      });
    });
  });

  describe('getBaseTeas', () => {
    it('should return only base teas', () => {
      const baseTeas = getBaseTeas();
      expect(baseTeas.length).toBeGreaterThan(0);
      baseTeas.forEach(tea => {
        expect(tea.isBase).toBe(true);
        expect(tea.category).toBe('base');
      });
    });

    it('should return at least 3 base teas', () => {
      const baseTeas = getBaseTeas();
      expect(baseTeas.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getAddIns', () => {
    it('should return only add-ins', () => {
      const addIns = getAddIns();
      expect(addIns.length).toBeGreaterThan(0);
      addIns.forEach(addIn => {
        expect(addIn.isBase).toBe(false);
      });
    });

    it('should return more add-ins than base teas', () => {
      const addIns = getAddIns();
      const baseTeas = getBaseTeas();
      expect(addIns.length).toBeGreaterThan(baseTeas.length);
    });

    it('should have add-ins from multiple categories', () => {
      const addIns = getAddIns();
      const categories = new Set(addIns.map(ing => ing.category));
      expect(categories.size).toBeGreaterThan(1);
      expect(categories.has('base')).toBe(false);
    });
  });

  describe('Ingredient consistency', () => {
    it('should have total ingredients equal to base teas + add-ins', () => {
      const total = INGREDIENTS.length;
      const baseTeas = getBaseTeas().length;
      const addIns = getAddIns().length;
      expect(total).toBe(baseTeas + addIns);
    });
  });
});
