/**
 * Pure emission calculation functions.
 * No React dependencies — 100% unit-testable.
 */

import type { CarbonCategory, SustainabilityScore, DayData, CarbonEntry } from '../types';

export const AVG_MONTHLY_KG = {
  us: 750,
  eu: 450,
  global: 390,
} as const;

const KG_PER_TREE_PER_YEAR = 22;
const KG_PER_FLIGHT_HOUR = 90;
const KG_PER_CAR_KM = 0.19;

export function calculateSustainabilityScore(monthlyKg: number): SustainabilityScore {
  const ratio = monthlyKg / AVG_MONTHLY_KG.us;
  const percentage = Math.max(0, Math.min(100, (1 - ratio) * 100));

  if (percentage >= 90) return { rating: 'A+', points: 95, percentage, color: '#059669', label: 'Exceptional' };
  if (percentage >= 75) return { rating: 'A', points: 80, percentage, color: '#10b981', label: 'Excellent' };
  if (percentage >= 55) return { rating: 'B', points: 65, percentage, color: '#34d399', label: 'Good' };
  if (percentage >= 35) return { rating: 'C', points: 45, percentage, color: '#f59e0b', label: 'Average' };
  if (percentage >= 15) return { rating: 'D', points: 25, percentage, color: '#f97316', label: 'Below Average' };
  return { rating: 'F', points: 10, percentage, color: '#ef4444', label: 'High Impact' };
}

export function projectAnnualEmissions(monthlyKg: number): number {
  return monthlyKg * 12;
}

export function treesNeededForOffset(annualKg: number): number {
  return Math.ceil(annualKg / KG_PER_TREE_PER_YEAR);
}

export function flightEquivalents(annualKg: number): number {
  return Math.round(annualKg / KG_PER_FLIGHT_HOUR);
}

export function carKmEquivalents(annualKg: number): number {
  return Math.round(annualKg / KG_PER_CAR_KM);
}

export function computeCategoryTotals(
  entries: CarbonEntry[],
  categories: readonly CarbonCategory[]
): Record<CarbonCategory, number> {
  const totals = {} as Record<CarbonCategory, number>;
  for (const cat of categories) {
    totals[cat] = entries
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + Number(e.co2_kg), 0);
  }
  return totals;
}

export function computeTotalKg(entries: CarbonEntry[]): number {
  return entries.reduce((sum, e) => sum + Number(e.co2_kg), 0);
}

export function computeDayData(entries: CarbonEntry[], days: number): DayData[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
    const dayTotal = entries
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + Number(e.co2_kg), 0);
    return { day: dayLabel, total: Number(dayTotal.toFixed(1)) };
  });
}

export function computeAverageDaily(dayData: DayData[]): number {
  if (dayData.length === 0) return 0;
  return dayData.reduce((sum, d) => sum + d.total, 0) / dayData.length;
}

export function computeTrendDirection(
  currentAvg: number,
  previousAvg: number
): 'up' | 'down' | 'flat' {
  const diff = currentAvg - previousAvg;
  if (diff < -1) return 'down';
  if (diff > 1) return 'up';
  return 'flat';
}

export function computeTrendPercent(currentAvg: number, previousAvg: number): string {
  if (previousAvg === 0) return '0';
  return (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(0);
}

export function computeSimulatedEmissions(
  baseline: Record<CarbonCategory, number>,
  factors: Record<CarbonCategory, number>,
  categories: readonly CarbonCategory[]
): Record<CarbonCategory, number> {
  const result = {} as Record<CarbonCategory, number>;
  for (const cat of categories) {
    result[cat] = baseline[cat] * (factors[cat] ?? 1);
  }
  return result;
}

export function computeSavings(baselineTotal: number, simulatedTotal: number): {
  savingsKg: number;
  savingsPercent: string;
} {
  const savingsKg = baselineTotal - simulatedTotal;
  const savingsPercent = baselineTotal > 0
    ? ((savingsKg / baselineTotal) * 100).toFixed(0)
    : '0';
  return { savingsKg, savingsPercent };
}
