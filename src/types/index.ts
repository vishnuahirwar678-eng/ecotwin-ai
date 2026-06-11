import type { LucideIcon } from 'lucide-react';

export type CarbonCategory = 'transport' | 'energy' | 'food' | 'shopping';

export interface CarbonEntry {
  id: string;
  user_id: string;
  category: CarbonCategory;
  description: string;
  co2_kg: number;
  date: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  monthly_goal_kg: number;
  created_at: string;
  updated_at: string;
}

export interface EmissionItem {
  label: string;
  co2: number;
  unit: string;
  source: string;
}

export interface CategoryConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
  items: EmissionItem[];
}

export interface CalculatorEntry {
  category: CarbonCategory;
  description: string;
  co2: number;
}

export interface DayData {
  day: string;
  total: number;
}

export interface CategoryTotal {
  cat: CarbonCategory;
  total: number;
}

export interface ChartDataPoint {
  category: string;
  baseline: number;
  simulated: number;
  color: string;
}

export interface SimulatorSlider {
  key: CarbonCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  options: { label: string; factor: number; description: string }[];
}

export interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface SustainabilityScore {
  rating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  points: number;
  percentage: number;
  color: string;
  label: string;
}
