import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  TrendingDown, Leaf, Target, Flame, BarChart3, Calendar,
  ArrowDownRight, ArrowUpRight, Minus
} from 'lucide-react';

interface CarbonEntry {
  id: string;
  category: string;
  description: string;
  co2_kg: number;
  date: string;
}

const COLORS = {
  transport: '#3b82f6',
  energy: '#f59e0b',
  food: '#10b981',
  shopping: '#f43f5e',
};

const categoryLabels: Record<string, string> = {
  transport: 'Transport',
  energy: 'Energy',
  food: 'Food',
  shopping: 'Shopping',
};

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
        <div className="w-12 h-12 rounded-full eco-gradient animate-pulse" />
      </div>
    );
  }

  const totalKg = entries.reduce((s, e) => s + Number(e.co2_kg), 0);
  const todayKg = entries
    .filter(e => e.date === new Date().toISOString().split('T')[0])
    .reduce((s, e) => s + Number(e.co2_kg), 0);

  const categoryTotals = Object.keys(COLORS).map(cat => ({
    name: categoryLabels[cat],
    value: entries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.co2_kg), 0),
    color: COLORS[cat as keyof typeof COLORS],
  })).filter(c => c.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
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
  const prevAvg = entries.length > 7
    ? entries.slice(0, Math.floor(entries.length / 2)).reduce((s, e) => s + Number(e.co2_kg), 0) /
      Math.max(1, new Set(entries.slice(0, Math.floor(entries.length / 2)).map(e => e.date)).size)
    : avgDaily;

  const trendPercent = prevAvg > 0 ? (((avgDaily - prevAvg) / prevAvg) * 100).toFixed(0) : '0';
  const trendDirection = Number(trendPercent) < 0 ? 'down' : Number(trendPercent) > 0 ? 'up' : 'flat';

  const monthlyGoal = 150;
  const monthlyProgress = Math.min(100, (totalKg / monthlyGoal) * 100);

  const statCards = [
    {
      label: 'Total Tracked',
      value: `${totalKg.toFixed(1)} kg`,
      icon: Flame,
      color: 'from-rose-500 to-orange-500',
    },
    {
      label: "Today's Emissions",
      value: `${todayKg.toFixed(1)} kg`,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Avg Daily',
      value: `${avgDaily.toFixed(1)} kg`,
      icon: BarChart3,
      color: 'from-amber-500 to-yellow-500',
      trend: trendDirection,
      trendValue: `${Math.abs(Number(trendPercent))}%`,
    },
    {
      label: 'Monthly Goal',
      value: `${monthlyProgress.toFixed(0)}%`,
      icon: Target,
      color: 'from-eco-500 to-teal-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your carbon footprint at a glance
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, trend, trendValue }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    trend === 'down' ? 'text-eco-600' : trend === 'up' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> :
                     trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    {trendValue}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Monthly Goal Progress */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-eco-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Goal</h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalKg.toFixed(1)} / {monthlyGoal} kg CO2
            </span>
          </div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${monthlyProgress < 80 ? 'eco-gradient' : monthlyProgress < 100 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
              style={{ width: `${monthlyProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {monthlyProgress < 80
              ? 'Great progress! You are well within your goal.'
              : monthlyProgress < 100
              ? 'Approaching your limit. Consider reducing some activities.'
              : 'You have exceeded your monthly goal. Time to take action!'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 7-Day Trend */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <TrendingDown className="w-5 h-5 text-eco-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7-Day Trend</h3>
            </div>
            {last7Days.some(d => d.total > 0) ? (
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
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '14px',
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#ecoGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                <p>No data yet. Start tracking in the Calculator!</p>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <Leaf className="w-5 h-5 text-eco-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Category Breakdown</h3>
            </div>
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
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {categoryTotals.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{name}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                <p>No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Entries */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Entries</h3>
          {entries.length > 0 ? (
            <div className="space-y-3">
              {entries.slice(0, 10).map(entry => (
                <div key={entry.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: COLORS[entry.category as keyof typeof COLORS] + '20' }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[entry.category as keyof typeof COLORS] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {categoryLabels[entry.category]} &middot; {entry.date}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{Number(entry.co2_kg).toFixed(1)} kg</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No entries yet. Start tracking your carbon footprint!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
