import { describe, it, expect } from 'vitest';
import {
  calculateSustainabilityScore,
  projectAnnualEmissions,
  treesNeededForOffset,
  flightEquivalents,
  carKmEquivalents,
  CATEGORY_CONFIG,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
  AVG_MONTHLY_KG,
} from '../lib/emissions';

describe('emissions utilities', () => {
  describe('calculateSustainabilityScore', () => {
    it('returns A+ for very low emissions', () => {
      const score = calculateSustainabilityScore(50);
      expect(score.rating).toBe('A+');
      expect(score.percentage).toBeGreaterThanOrEqual(90);
    });

    it('returns A for low emissions', () => {
      const score = calculateSustainabilityScore(150);
      expect(score.rating).toBe('A');
      expect(score.percentage).toBeGreaterThanOrEqual(75);
    });

    it('returns B for moderate emissions', () => {
      const score = calculateSustainabilityScore(300);
      expect(score.rating).toBe('B');
      expect(score.percentage).toBeGreaterThanOrEqual(55);
    });

    it('returns C for average emissions', () => {
      const score = calculateSustainabilityScore(450);
      expect(score.rating).toBe('C');
      expect(score.percentage).toBeGreaterThanOrEqual(35);
    });

    it('returns D for high emissions', () => {
      const score = calculateSustainabilityScore(600);
      expect(score.rating).toBe('D');
      expect(score.percentage).toBeGreaterThanOrEqual(15);
    });

    it('returns F for very high emissions', () => {
      const score = calculateSustainabilityScore(1000);
      expect(score.rating).toBe('F');
    });

    it('always returns percentage between 0 and 100', () => {
      const low = calculateSustainabilityScore(0);
      const high = calculateSustainabilityScore(5000);
      expect(low.percentage).toBeLessThanOrEqual(100);
      expect(high.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('projectAnnualEmissions', () => {
    it('projects 12x monthly emissions', () => {
      expect(projectAnnualEmissions(100)).toBe(1200);
      expect(projectAnnualEmissions(0)).toBe(0);
    });
  });

  describe('treesNeededForOffset', () => {
    it('calculates trees based on 22 kg/tree/year', () => {
      expect(treesNeededForOffset(220)).toBe(10);
      expect(treesNeededForOffset(0)).toBe(0);
      expect(treesNeededForOffset(23)).toBe(2); // rounds up
    });
  });

  describe('flightEquivalents', () => {
    it('calculates flight hours based on 90 kg/hour', () => {
      expect(flightEquivalents(900)).toBe(10);
      expect(flightEquivalents(0)).toBe(0);
    });
  });

  describe('carKmEquivalents', () => {
    it('calculates km based on 0.19 kg/km', () => {
      expect(carKmEquivalents(190)).toBe(1000);
      expect(carKmEquivalents(0)).toBe(0);
    });
  });

  describe('CATEGORY_CONFIG', () => {
    it('has all four categories', () => {
      expect(Object.keys(CATEGORY_CONFIG)).toEqual(['transport', 'energy', 'food', 'shopping']);
    });

    it('each category has items with valid CO2 values', () => {
      ALL_CATEGORIES.forEach(cat => {
        const config = CATEGORY_CONFIG[cat];
        expect(config.items.length).toBeGreaterThan(0);
        config.items.forEach(item => {
          expect(item.co2).toBeGreaterThanOrEqual(0);
          expect(item.label).toBeTruthy();
          expect(item.source).toBeTruthy();
        });
      });
    });
  });

  describe('AVG_MONTHLY_KG', () => {
    it('has reasonable values for US, EU, and global averages', () => {
      expect(AVG_MONTHLY_KG.us).toBeGreaterThan(AVG_MONTHLY_KG.eu);
      expect(AVG_MONTHLY_KG.eu).toBeGreaterThan(AVG_MONTHLY_KG.global);
    });
  });
});
