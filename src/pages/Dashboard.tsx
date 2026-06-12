import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import {
  CATEGORY_COLORS, CATEGORY_LABELS, ALL_CATEGORIES,
  AVG_MONTHLY_KG,
} from '../lib/emissions';
import {
  useCategoryTotals, useTotalKg, useDayData, useAverageDaily,
  useTrend, useSustainabilityMetrics,
} from '../hooks/useEmissions';
import { useChartToggle, type DataViewMode } from '../hooks/useChartToggle';
import type { CarbonEntry, CarbonCategory, StatCard as StatCardType } from '../types';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import SustainabilityScore from '../components/ui/SustainabilityScore';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  TrendingDown, Leaf, Target, Flame, BarChart3, Calendar, TreePine, Plane, Car,
} from 'lucide-react';

interface CategoryTotalItem {
  name: string;
  value: number;
  color: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const trendChartToggle = useChartToggle('chart');
  const categoryChartToggle = useChartToggle('chart');

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from('carbon_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setEntries((data as CarbonEntry[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalKg = useTotalKg(entries);
  const categoryTotalsMap = useCategoryTotals(entries);
  const last7Days = useDayData(entries, 7);
  const avgDaily = useAverageDaily(last7Days);
  const monthlyEstimate = useMemo(() => avgDaily * 30, [avgDaily]);

  const { score, trees: treesNeeded, flights: flightEquiv, carKm: carEquiv } =
    useSustainabilityMetrics(monthlyEstimate);

  const prevAvg = useMemo(() => {
    if (entries.length <= 7) return avgDaily;
    const halfIdx = Math.floor(entries.length / 2);
    const halfEntries = entries.slice(0, halfIdx);
    const uniqueDays = new Set(halfEntries.map(e => e.date)).size;
    return uniqueDays > 0
      ? halfEntries.reduce((s, e) => s + Number(e.co2_kg), 0) / uniqueDays
      : avgDaily;
  }, [entries, avgDaily]);

  const { direction: trendDirection, percent: trendPercent } = useTrend(avgDaily, prevAvg);

  const monthlyGoal = 150;
  const goalVariant = useMemo((): 'default' | 'warning' | 'danger' => {
    const pct = (totalKg / monthlyGoal) * 100;
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warning';
    return 'default';
  }, [totalKg, monthlyGoal]);

  const todayKg = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return entries
      .filter(e => e.date === todayStr)
      .reduce((s, e) => s + Number(e.co2_kg), 0);
  }, [entries]);

  const statCards: StatCardType[] = useMemo(() => [
    { label: 'Total Tracked', value: `${totalKg.toFixed(1)} kg`, icon: Flame, color: 'from-rose-500 to-orange-500' },
    { label: "Today's Emissions", value: `${todayKg.toFixed(1)} kg`, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { label: 'Avg Daily', value: `${avgDaily.toFixed(1)} kg`, icon: BarChart3, color: 'from-amber-500 to-yellow-500', trend: trendDirection, trendValue: `${Math.abs(Number(trendPercent))}%` },
    { label: 'Monthly Estimate', value: `${monthlyEstimate.toFixed(0)} kg`, icon: Target, color: 'from-eco-500 to-teal-500' },
  ], [totalKg, todayKg, avgDaily, trendDirection, trendPercent, monthlyEstimate]);

  const categoryTotals: CategoryTotalItem[] = useMemo(() =>
    ALL_CATEGORIES.map(cat => ({
      name: CATEGORY_LABELS[cat],
      value: categoryTotalsMap[cat],
      color: CATEGORY_COLORS[cat],
    })).filter(c => c.value > 0),
    [categoryTotalsMap]
  );

  const tooltipStyle = useMemo(() => ({
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
  }), []);

  const renderTrendTable = useCallback(() => (
    <table className="w-full text-sm" tabIndex={-1}>
      <caption className="sr-only">7-day carbon emissions data</caption>
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th scope="col" className="py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Day</th>
          <th scope="col" className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">CO2 (kg)</th>
        </tr>
      </thead>
      <tbody>
        {last7Days.map(row => (
          <tr key={row.day} className="border-b border-gray-100 dark:border-gray-800">
            <td className="py-2 text-slate-700 dark:text-slate-300">{row.day}</td>
            <td className="py-2 text-right font-medium text-slate-900 dark:text-slate-100">{row.total}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-bold">
          <td className="py-2 text-slate-700 dark:text-slate-300">Average</td>
          <td className="py-2 text-right text-slate-900 dark:text-slate-100">{avgDaily.toFixed(1)}</td>
        </tr>
      </tfoot>
    </table>
  ), [last7Days, avgDaily]);

  const renderCategoryTable = useCallback(() => (
    <table className="w-full text-sm" tabIndex={-1}>
      <caption className="sr-only">Emissions breakdown by category</caption>
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th scope="col" className="py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Category</th>
          <th scope="col" className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">CO2 (kg)</th>
          <th scope="col" className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Share</th>
        </tr>
      </thead>
      <tbody>
        {categoryTotals.map(row => (
          <tr key={row.name} className="border-b border-gray-100 dark:border-gray-800">
            <td className="py-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: row.color }} aria-hidden="true" />
                <span className="text-slate-700 dark:text-slate-300">{row.name}</span>
              </span>
            </td>
            <td className="py-2 text-right font-medium text-slate-900 dark:text-slate-100">{row.value.toFixed(1)}</td>
            <td className="py-2 text-right text-slate-700 dark:text-slate-300">
              {totalKg > 0 ? ((row.value / totalKg) * 100).toFixed(0) : 0}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ), [categoryTotals, totalKg]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your carbon footprint at a glance</p>
        </header>

        {entries.length === 0 ? (
          <EmptyState
            icon={Leaf}
            title="No data yet"
            description="Start tracking your carbon footprint in the Calculator to see your dashboard analytics."
          />
        ) : (
          <>
            {/* Stat Cards */}
            <section aria-label="Emission statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(card => (
                <StatCard key={card.label} {...card} />
              ))}
            </section>

            {/* Score + Goal Row */}
            <section aria-label="Sustainability score and goals" className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sustainability Score</h2>
                <SustainabilityScore score={score} size="lg" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Based on US avg of {AVG_MONTHLY_KG.us} kg/month
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-eco-500" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Goal</h2>
                </div>
                <ProgressBar value={totalKg} max={monthlyGoal} label="CO2 Budget" variant={goalVariant} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {goalVariant === 'default'
                    ? 'Great progress! You are well within your goal.'
                    : goalVariant === 'warning'
                    ? 'Approaching your limit. Consider reducing some activities.'
                    : 'You have exceeded your monthly goal. Time to take action!'}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Annual Impact</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-eco-50 dark:bg-eco-900/20">
                    <TreePine className="w-5 h-5 text-eco-600 dark:text-eco-400" aria-hidden="true" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">Trees to offset</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{treesNeeded}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">Flight hours equivalent</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{flightEquiv}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">Driving km equivalent</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{carEquiv.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* 7-Day Trend */}
              <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-eco-500" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7-Day Trend</h2>
                  </div>
                  {/* Toggle */}
                  <div role="radiogroup" aria-label="View mode for 7-day trend" className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {(['chart', 'table'] as DataViewMode[]).map(m => (
                      <button
                        key={m}
                        role="radio"
                        aria-checked={trendChartToggle.mode === m}
                        onClick={() => trendChartToggle.toggle(m)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 ${
                          trendChartToggle.mode === m
                            ? 'bg-eco-50 dark:bg-eco-900/30 text-eco-700 dark:text-eco-400'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {m === 'chart' ? 'Chart' : 'Table'}
                      </button>
                    ))}
                  </div>
                </div>

                <figure role="img" aria-label={`7-day emissions trend averaging ${avgDaily.toFixed(1)} kg per day`} {...trendChartToggle.chartProps}>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={last7Days}>
                      <defs>
                        <linearGradient id="ecoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#ecoGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </figure>

                <div {...trendChartToggle.tableProps}>
                  {renderTrendTable()}
                </div>
              </section>

              {/* Category Breakdown */}
              <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-eco-500" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h2>
                  </div>
                  <div role="radiogroup" aria-label="View mode for category breakdown" className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {(['chart', 'table'] as DataViewMode[]).map(m => (
                      <button
                        key={m}
                        role="radio"
                        aria-checked={categoryChartToggle.mode === m}
                        onClick={() => categoryChartToggle.toggle(m)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 ${
                          categoryChartToggle.mode === m
                            ? 'bg-eco-50 dark:bg-eco-900/30 text-eco-700 dark:text-eco-400'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {m === 'chart' ? 'Chart' : 'Table'}
                      </button>
                    ))}
                  </div>
                </div>

                <figure role="img" aria-label={`Emissions by category: ${categoryTotals.map(c => `${c.name} ${c.value.toFixed(1)}kg`).join(', ')}`} {...categoryChartToggle.chartProps}>
                  {categoryTotals.length > 0 ? (
                    <div className="flex items-center gap-8">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie
                            data={categoryTotals}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryTotals.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(1)} kg`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-3">
                        {categoryTotals.map(({ name, value, color }) => (
                          <div key={name} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{name}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value.toFixed(1)} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                      <p>No data yet</p>
                    </div>
                  )}
                </figure>

                <div {...categoryChartToggle.tableProps}>
                  {renderCategoryTable()}
                </div>
              </section>
            </div>

            {/* Recent Entries */}
            <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800" aria-label="Recent emission entries">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Entries</h2>
              <ul className="space-y-3">
                {entries.slice(0, 10).map(entry => (
                  <li key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: CATEGORY_COLORS[entry.category as CarbonCategory] + '20' }}
                      aria-hidden="true"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.category as CarbonCategory] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{entry.description}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {CATEGORY_LABELS[entry.category as CarbonCategory]} &middot; {entry.date}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100" aria-label={`${Number(entry.co2_kg).toFixed(1)} kg CO2`}>
                      {Number(entry.co2_kg).toFixed(1)} kg
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
