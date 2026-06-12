/**
 * Category configuration and constants.
 * Calculation functions are in src/utils/emissions.ts (pure, testable).
 */

import { Car, Zap, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import type { CarbonCategory, CategoryConfig, EmissionItem } from '../types';

// Re-export pure functions for backward compatibility
export {
  calculateSustainabilityScore,
  projectAnnualEmissions,
  treesNeededForOffset,
  flightEquivalents,
  carKmEquivalents,
  AVG_MONTHLY_KG,
} from '../utils/emissions';

const transportItems: EmissionItem[] = [
  { label: 'Car (gasoline) – 10 km', co2: 1.9, unit: 'kg CO2e', source: 'EPA GHG Equivalencies' },
  { label: 'Car (diesel) – 10 km', co2: 1.7, unit: 'kg CO2e', source: 'EPA GHG Equivalencies' },
  { label: 'SUV/Truck – 10 km', co2: 2.8, unit: 'kg CO2e', source: 'EPA GHG Equivalencies' },
  { label: 'Hybrid car – 10 km', co2: 1.1, unit: 'kg CO2e', source: 'EPA GHG Equivalencies' },
  { label: 'Electric car – 10 km', co2: 0.5, unit: 'kg CO2e', source: 'IEA Global EV Data Explorer' },
  { label: 'City bus – 10 km', co2: 0.7, unit: 'kg CO2e', source: 'APTFA Avg Fleet Emissions' },
  { label: 'Commuter rail – 10 km', co2: 0.3, unit: 'kg CO2e', source: 'FTA National Transit DB' },
  { label: 'Subway/Metro – 10 km', co2: 0.2, unit: 'kg CO2e', source: 'FTA National Transit DB' },
  { label: 'Domestic flight – 1 hr', co2: 70, unit: 'kg CO2e', source: 'ICAO Carbon Emissions Calc' },
  { label: 'Long-haul flight – 1 hr', co2: 90, unit: 'kg CO2e', source: 'ICAO Carbon Emissions Calc' },
  { label: 'Bicycle / e-bike – 10 km', co2: 0, unit: 'kg CO2e', source: 'Zero direct emissions' },
  { label: 'Walking – 5 km', co2: 0, unit: 'kg CO2e', source: 'Zero direct emissions' },
];

const energyItems: EmissionItem[] = [
  { label: 'Electricity – 1 day (US avg)', co2: 5.5, unit: 'kg CO2e', source: 'EIA Avg Household' },
  { label: 'Electricity – 1 day (EU avg)', co2: 2.3, unit: 'kg CO2e', source: 'EEA Avg Household' },
  { label: 'Natural gas heating – 1 day', co2: 3.2, unit: 'kg CO2e', source: 'EIA Residential' },
  { label: 'Oil heating – 1 day', co2: 5.8, unit: 'kg CO2e', source: 'EIA Residential' },
  { label: 'Air conditioning – 8 hrs', co2: 4.0, unit: 'kg CO2e', source: 'DOE Energy Saver' },
  { label: 'Heat pump – 1 day', co2: 1.8, unit: 'kg CO2e', source: 'DOE Energy Saver' },
  { label: 'LED lighting – 1 day', co2: 0.3, unit: 'kg CO2e', source: 'EIA Residential' },
  { label: 'Incandescent lighting – 1 day', co2: 1.2, unit: 'kg CO2e', source: 'EIA Residential' },
  { label: 'Clothes dryer – 1 load', co2: 2.0, unit: 'kg CO2e', source: 'EIA Residential' },
  { label: 'Standby power – 1 day', co2: 0.8, unit: 'kg CO2e', source: 'IEA Standby Power' },
];

const foodItems: EmissionItem[] = [
  { label: 'Beef serving (150g)', co2: 6.6, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Lamb serving (150g)', co2: 5.8, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Pork serving (150g)', co2: 1.9, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Poultry serving (150g)', co2: 1.3, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Fish serving (150g)', co2: 1.5, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Dairy (cheese/milk) – 1 meal', co2: 2.0, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Vegetarian meal', co2: 0.9, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Vegan meal', co2: 0.4, unit: 'kg CO2e', source: 'Poore & Nemecek (Science 2018)' },
  { label: 'Food waste – 1 meal', co2: 2.5, unit: 'kg CO2e', source: 'FAO Food Waste Report' },
  { label: 'Imported produce – 1 meal', co2: 1.8, unit: 'kg CO2e', source: 'Weber & Matthews (ES&T 2008)' },
  { label: 'Local seasonal produce – 1 meal', co2: 0.3, unit: 'kg CO2e', source: 'Weber & Matthews (ES&T 2008)' },
];

const shoppingItems: EmissionItem[] = [
  { label: 'Fast-fashion garment', co2: 12.0, unit: 'kg CO2e', source: 'McKinsey Fashion Index' },
  { label: 'Quality garment', co2: 22.0, unit: 'kg CO2e', source: 'McKinsey Fashion Index' },
  { label: 'Second-hand clothing', co2: 1.0, unit: 'kg CO2e', source: 'ThredUP Resale Report' },
  { label: 'Smartphone (new)', co2: 70.0, unit: 'kg CO2e', source: 'Apple Environmental Report' },
  { label: 'Laptop (new)', co2: 200.0, unit: 'kg CO2e', source: 'Dell ESG Report' },
  { label: 'Refurbished electronics', co2: 15.0, unit: 'kg CO2e', source: 'Back Market Estimate' },
  { label: 'Furniture (new)', co2: 80.0, unit: 'kg CO2e', source: 'IKEA Sustainability Report' },
  { label: 'Online delivery package', co2: 2.5, unit: 'kg CO2e', source: 'EPA Logistics Emissions' },
  { label: 'Books/magazines', co2: 3.0, unit: 'kg CO2e', source: 'EPA Paper & Print' },
];

export const CATEGORY_CONFIG: Record<CarbonCategory, CategoryConfig> = {
  transport: {
    icon: Car,
    label: 'Transport',
    color: 'from-blue-500 to-cyan-600',
    bgColor: '#3b82f6',
    items: transportItems,
  },
  energy: {
    icon: Zap,
    label: 'Energy',
    color: 'from-amber-500 to-orange-600',
    bgColor: '#f59e0b',
    items: energyItems,
  },
  food: {
    icon: UtensilsCrossed,
    label: 'Food',
    color: 'from-green-500 to-emerald-600',
    bgColor: '#10b981',
    items: foodItems,
  },
  shopping: {
    icon: ShoppingBag,
    label: 'Shopping',
    color: 'from-rose-500 to-pink-600',
    bgColor: '#f43f5e',
    items: shoppingItems,
  },
};

export const CATEGORY_COLORS: Record<CarbonCategory, string> = {
  transport: '#3b82f6',
  energy: '#f59e0b',
  food: '#10b981',
  shopping: '#f43f5e',
};

export const CATEGORY_LABELS: Record<CarbonCategory, string> = {
  transport: 'Transport',
  energy: 'Energy',
  food: 'Food',
  shopping: 'Shopping',
};

export const ALL_CATEGORIES: readonly CarbonCategory[] = ['transport', 'energy', 'food', 'shopping'];
