/**
 * Tests for mock data utilities
 */

import { 
  MOCK_BASES, 
  MOCK_ADDINS, 
  getAllBlendingIngredients, 
  getBlendingIngredientById,
  getAddInsByTab 
} from '../mockData';

describe('Mock Data', () => {
  describe('MOCK_BASES', () => {
    it('should have at least one base tea', () => {
      expect(MOCK_BASES.length).toBeGreaterThan(0);
    });

    it('should have required fields for each base', () => {
      for (const base of MOCK_BASES) {
        expect(base.id).toBeDefined();
        expect(base.name).toBeDefined();
        expect(base.category).toBe('base');
        expect(base.isBase).toBe(true);
        expect(base.costPerOz).toBeGreaterThan(0);
        expect(base.flavorProfile).toBeDefined();
      }
    });
  });

  describe('MOCK_ADDINS', () => {
    it('should have at least one add-in', () => {
      expect(MOCK_ADDINS.length).toBeGreaterThan(0);
    });

    it('should have required fields for each add-in', () => {
      for (const addIn of MOCK_ADDINS) {
        expect(addIn.id).toBeDefined();
        expect(addIn.name).toBeDefined();
        expect(addIn.isBase).toBe(false);
        expect(addIn.costPerOz).toBeGreaterThan(0);
        expect(addIn.flavorProfile).toBeDefined();
      }
    });
  });

  describe('getAllBlendingIngredients', () => {
    it('should return all bases and add-ins', () => {
      const all = getAllBlendingIngredients();
      expect(all.length).toBe(MOCK_BASES.length + MOCK_ADDINS.length);
    });
  });

  describe('getBlendingIngredientById', () => {
    it('should find existing ingredient by id', () => {
      const ingredient = getBlendingIngredientById('moonlit-black');
      expect(ingredient).toBeDefined();
      expect(ingredient?.name).toBe('Moonlit Black');
    });

    it('should return undefined for non-existent id', () => {
      const ingredient = getBlendingIngredientById('non-existent');
      expect(ingredient).toBeUndefined();
    });
  });

  describe('getAddInsByTab', () => {
    it('should return add-ins for the addIns tab', () => {
      const addIns = getAddInsByTab('addIns');
      expect(addIns.length).toBeGreaterThan(0);
      // All should be standard tier and fruit/spice/herbal category
      for (const addIn of addIns) {
        expect(['fruit', 'spice', 'herbal']).toContain(addIn.category);
        expect(addIn.tier).toBe('standard');
      }
    });

    it('should return botanicals for the botanicals tab', () => {
      const botanicals = getAddInsByTab('botanicals');
      expect(botanicals.length).toBeGreaterThan(0);
      // All should be floral category
      for (const addIn of botanicals) {
        expect(addIn.category).toBe('floral');
      }
    });

    it('should return premium items for the premium tab', () => {
      const premium = getAddInsByTab('premium');
      expect(premium.length).toBeGreaterThan(0);
      // All should be premium tier or special category
      for (const addIn of premium) {
        expect(
          addIn.tier === 'premium' || addIn.category === 'special'
        ).toBe(true);
      }
    });
  });
});
