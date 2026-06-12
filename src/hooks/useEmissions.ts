/**
 * Custom hooks for memoized emission calculations.
 */

import { useMemo } from 'react';
import type { CarbonCategory, CarbonEntry, DayData } from '../types';
import {
  computeCategoryTotals,
  computeTotalKg,
  computeDayData,
  computeAverageDaily,
  computeTrendDirection,
  computeTrendPercent,
  computeSimulatedEmissions,
  computeSavings,
  calculateSustainabilityScore,
  projectAnnualEmissions,
  treesNeededForOffset,
  flightEquivalents,
  carKmEquivalents,
} from '../utils/emissions';
import { ALL_CATEGORIES } from '../lib/emissions';

export function useCategoryTotals(entries: CarbonEntry[]) {
  return useMemo(
    () => computeCategoryTotals(entries, ALL_CATEGORIES),
    [entries]
  );
}

export function useTotalKg(entries: CarbonEntry[]) {
  return useMemo(() => computeTotalKg(entries), [entries]);
}

export function useDayData(entries: CarbonEntry[], days: number = 7) {
  return useMemo(() => computeDayData(entries, days), [entries, days]);
}

export function useAverageDaily(dayData: DayData[]) {
  return useMemo(() => computeAverageDaily(dayData), [dayData]);
}

export function useTrend(currentAvg: number, previousAvg: number) {
  const direction = useMemo(
    () => computeTrendDirection(currentAvg, previousAvg),
    [currentAvg, previousAvg]
  );
  const percent = useMemo(
    () => computeTrendPercent(currentAvg, previousAvg),
    [currentAvg, previousAvg]
  );
  return { direction, percent };
}

export function useSimulatedEmissions(
  baseline: Record<CarbonCategory, number>,
  factors: Record<CarbonCategory, number>
) {
  return useMemo(
    () => computeSimulatedEmissions(baseline, factors, ALL_CATEGORIES),
    [baseline, factors]
  );
}

export function useSavings(baselineTotal: number, simulatedTotal: number) {
  return useMemo(
    () => computeSavings(baselineTotal, simulatedTotal),
    [baselineTotal, simulatedTotal]
  );
}

export function useSustainabilityMetrics(monthlyKg: number) {
  const score = useMemo(() => calculateSustainabilityScore(monthlyKg), [monthlyKg]);
  const annual = useMemo(() => projectAnnualEmissions(monthlyKg), [monthlyKg]);
  const trees = useMemo(() => treesNeededForOffset(annual), [annual]);
  const flights = useMemo(() => flightEquivalents(annual), [annual]);
  const carKm = useMemo(() => carKmEquivalents(annual), [annual]);
  return { score, annual, trees, flights, carKm };
}
