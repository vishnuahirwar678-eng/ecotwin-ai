import { describe, it, expect } from 'vitest';
import {
  calculateSustainabilityScore,
  projectAnnualEmissions,
  treesNeededForOffset,
  flightEquivalents,
  carKmEquivalents,
  computeCategoryTotals,
  computeTotalKg,
  computeDayData,
  computeAverageDaily,
  computeTrendDirection,
  computeTrendPercent,
  computeSimulatedEmissions,
  computeSavings,
  AVG_MONTHLY_KG,
} from '../utils/emissions';
import {
  CATEGORY_CONFIG,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
} from '../lib/emissions';
import type { CarbonEntry } from '../types';

function makeEntry(cat: string, kg: number, date = '2025-01-01'): CarbonEntry {
  return {
    id: `test-${Math.random()}`,
    user_id: 'u1',
    category: cat as CarbonEntry['category'],
    description: 'test',
    co2_kg: kg,
    date,
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
  };
}

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
      expect(treesNeededForOffset(23)).toBe(2);
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

  describe('computeCategoryTotals', () => {
    it('computes totals per category', () => {
      const entries = [makeEntry('transport', 5), makeEntry('transport', 3), makeEntry('food', 2)];
      const totals = computeCategoryTotals(entries, ALL_CATEGORIES);
      expect(totals.transport).toBe(8);
      expect(totals.food).toBe(2);
      expect(totals.energy).toBe(0);
      expect(totals.shopping).toBe(0);
    });
  });

  describe('computeTotalKg', () => {
    it('sums all co2_kg values', () => {
      const entries = [makeEntry('transport', 5), makeEntry('food', 2)];
      expect(computeTotalKg(entries)).toBe(7);
    });

    it('returns 0 for empty entries', () => {
      expect(computeTotalKg([])).toBe(0);
    });
  });

  describe('computeAverageDaily', () => {
    it('computes average from DayData', () => {
      const days = [{ day: 'Mon', total: 10 }, { day: 'Tue', total: 20 }];
      expect(computeAverageDaily(days)).toBe(15);
    });

    it('returns 0 for empty data', () => {
      expect(computeAverageDaily([])).toBe(0);
    });
  });

  describe('computeTrendDirection', () => {
    it('returns down for decreasing trend', () => {
      expect(computeTrendDirection(5, 10)).toBe('down');
    });

    it('returns up for increasing trend', () => {
      expect(computeTrendDirection(10, 5)).toBe('up');
    });

    it('returns flat for minimal change', () => {
      expect(computeTrendDirection(5, 5.5)).toBe('flat');
    });
  });

  describe('computeTrendPercent', () => {
    it('computes percent change', () => {
      expect(computeTrendPercent(5, 10)).toBe('-50');
    });

    it('returns 0 when previous is 0', () => {
      expect(computeTrendPercent(5, 0)).toBe('0');
    });
  });

  describe('computeSimulatedEmissions', () => {
    it('applies factors to baseline', () => {
      const baseline = { transport: 100, energy: 50, food: 30, shopping: 20 };
      const factors = { transport: 0.5, energy: 0.8, food: 1, shopping: 0.7 };
      const result = computeSimulatedEmissions(baseline, factors, ALL_CATEGORIES);
      expect(result.transport).toBe(50);
      expect(result.energy).toBe(40);
      expect(result.food).toBe(30);
      expect(result.shopping).toBe(14);
    });
  });

  describe('computeSavings', () => {
    it('computes savings and percent', () => {
      const { savingsKg, savingsPercent } = computeSavings(100, 60);
      expect(savingsKg).toBe(40);
      expect(savingsPercent).toBe('40');
    });

    it('handles zero baseline', () => {
      const { savingsKg, savingsPercent } = computeSavings(0, 0);
      expect(savingsKg).toBe(0);
      expect(savingsPercent).toBe('0');
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
