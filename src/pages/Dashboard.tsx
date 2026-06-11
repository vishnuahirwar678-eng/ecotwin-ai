import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  CATEGORY_COLORS, CATEGORY_LABELS, ALL_CATEGORIES,
  calculateSustainabilityScore, projectAnnualEmissions,
  treesNeededForOffset, flightEquivalents, carKmEquivalents, AVG_MONTHLY_KG,
} from '../lib/emissions';
import type { CarbonEntry, CarbonCategory, DayData, StatCard as StatCardType } from '../types';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import SustainabilityScore from '../components/ui/SustainabilityScore';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  TrendingDown, Leaf, Target, Flame, BarChart3, Calendar, TreePine, Plane, Car,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('carbon_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setEntries((data as CarbonEntry[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalKg = entries.reduce((s, e) => s + Number(e.co2_kg), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayKg = entries
    .filter(e => e.date === todayStr)
    .reduce((s, e) => s + Number(e.co2_kg), 0);

  const categoryTotals = ALL_CATEGORIES.map(cat => ({
    name: CATEGORY_LABELS[cat],
    value: entries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.co2_kg), 0),
    color: CATEGORY_COLORS[cat],
  })).filter(c => c.value > 0);

  const last7Days: DayData[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
    const dayTotal = entries
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + Number(e.co2_kg), 0);
    return { day: dayLabel, total: Number(dayTotal.toFixed(1)) };
  });

  const avgDaily = last7Days.reduce((s, d) => s + d.total, 0) / 7;
  const monthlyEstimate = avgDaily * 30;
  const annualEstimate = projectAnnualEmissions(monthlyEstimate);
  const score = calculateSustainabilityScore(monthlyEstimate);

  const prevAvg = entries.length > 7
    ? entries.slice(0, Math.floor(entries.length / 2)).reduce((s, e) => s + Number(e.co2_kg), 0) /
      Math.max(1, new Set(entries.slice(0, Math.floor(entries.length / 2)).map(e => e.date)).size)
    : avgDaily;

  const trendPercent = prevAvg > 0 ? (((avgDaily - prevAvg) / prevAvg) * 100).toFixed(0) : '0';
  const trendDirection: 'up' | 'down' | 'flat' = Number(trendPercent) < -1 ? 'down' : Number(trendPercent) > 1 ? 'up' : 'flat';

  const monthlyGoal = 150;
  const goalVariant: 'default' | 'warning' | 'danger' =
    (totalKg / monthlyGoal) * 100 >= 100 ? 'danger' :
    (totalKg / monthlyGoal) * 100 >= 80 ? 'warning' : 'default';

  const statCards: StatCardType[] = [
    { label: 'Total Tracked', value: `${totalKg.toFixed(1)} kg`, icon: Flame, color: 'from-rose-500 to-orange-500' },
    { label: "Today's Emissions", value: `${todayKg.toFixed(1)} kg`, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { label: 'Avg Daily', value: `${avgDaily.toFixed(1)} kg`, icon: BarChart3, color: 'from-amber-500 to-yellow-500', trend: trendDirection, trendValue: `${Math.abs(Number(trendPercent))}%` },
    { label: 'Monthly Estimate', value: `${monthlyEstimate.toFixed(0)} kg`, icon: Target, color: 'from-eco-500 to-teal-500' },
  ];

  const treesNeeded = treesNeededForOffset(annualEstimate);
  const flightEquiv = flightEquivalents(annualEstimate);
  const carEquiv = carKmEquivalents(annualEstimate);

  const tooltipStyle = {
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your carbon footprint at a glance</p>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={Leaf}
            title="No data yet"
            description="Start tracking your carbon footprint in the Calculator to see your dashboard analytics."
          />
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(card => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>

            {/* Score + Goal Row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Sustainability Score */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sustainability Score</h3>
                <SustainabilityScore score={score} size="lg" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Based on US avg of {AVG_MONTHLY_KG.us} kg/month
                </p>
              </div>

              {/* Monthly Goal */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-eco-500" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Goal</h3>
                </div>
                <ProgressBar
                  value={totalKg}
                  max={monthlyGoal}
                  label="CO2 Budget"
                  variant={goalVariant}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {goalVariant === 'default'
                    ? 'Great progress! You are well within your goal.'
                    : goalVariant === 'warning'
                    ? 'Approaching your limit. Consider reducing some activities.'
                    : 'You have exceeded your monthly goal. Time to take action!'}
                </p>
              </div>

              {/* Environmental Equivalents */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Annual Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-eco-50 dark:bg-eco-900/20">
                    <TreePine className="w-5 h-5 text-eco-600 dark:text-eco-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{treesNeeded} trees needed</p>
                      <p className="text-xs text-gray-500">to offset your annual emissions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{flightEquiv} flight hours</p>
                      <p className="text-xs text-gray-500">equivalent CO2</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{carEquiv.toLocaleString()} km driven</p>
                      <p className="text-xs text-gray-500">equivalent CO2</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* 7-Day Trend */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingDown className="w-5 h-5 text-eco-500" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7-Day Trend</h3>
                </div>
                {last7Days.some(d => d.total > 0) ? (
                  <div role="img" aria-label="7-day emissions trend chart">
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
                      <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#ecoGrad)" strokeWidth={2} name="kg CO2" />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-600">No data yet this week</p>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                  <Leaf className="w-5 h-5 text-eco-500" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
                </div>
                {categoryTotals.length > 0 ? (
                  <div className="flex items-center gap-8">
                    <div role="img" aria-label="Category breakdown pie chart">
                    <ResponsiveContainer width="50%" height={220}>
                      <PieChart>
                        <Pie
                          data={categoryTotals}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85}
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
                    </div>
                    <div className="flex-1 space-y-3">
                      {categoryTotals.map(({ name, value, color }) => (
                        <div key={name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{name}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{value.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-600">No data yet</p>
                )}
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Entries</h3>
              <div className="space-y-3">
                {entries.slice(0, 10).map(entry => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[entry.category as CarbonCategory] + '20' }}
                      aria-hidden="true"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.category as CarbonCategory] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {CATEGORY_LABELS[entry.category as CarbonCategory]} &middot; {entry.date}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{Number(entry.co2_kg).toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
