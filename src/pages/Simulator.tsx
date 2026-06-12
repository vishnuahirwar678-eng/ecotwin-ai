import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '../lib/emissions';
import {
  computeSimulatedEmissions, computeSavings,
  projectAnnualEmissions, treesNeededForOffset, flightEquivalents,
} from '../utils/emissions';
import { useChartToggle, type DataViewMode } from '../hooks/useChartToggle';
import type { CarbonCategory, CarbonEntry, SimulatorSlider, ChartDataPoint } from '../types';
import Spinner from '../components/ui/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  FlaskConical, Car, Zap, UtensilsCrossed, ShoppingBag,
  ArrowRight, RotateCcw, TrendingDown, Info, TreePine, Plane,
} from 'lucide-react';

const sliders: SimulatorSlider[] = [
  {
    key: 'transport',
    label: 'Transport Reduction',
    icon: Car,
    color: '#3b82f6',
    options: [
      { label: 'No change', factor: 1, description: 'Keep current habits' },
      { label: 'Carpool 2x/week', factor: 0.85, description: 'Share rides to work twice weekly' },
      { label: 'Switch to public transit', factor: 0.6, description: 'Replace car with bus/train' },
      { label: 'Bicycle/Walk short trips', factor: 0.3, description: 'Active transport under 5 km' },
      { label: 'Full EV switch', factor: 0.25, description: 'Replace gas car with electric' },
    ],
  },
  {
    key: 'energy',
    label: 'Energy Reduction',
    icon: Zap,
    color: '#f59e0b',
    options: [
      { label: 'No change', factor: 1, description: 'Keep current energy use' },
      { label: 'LED + smart thermostat', factor: 0.8, description: 'Efficient lighting and climate control' },
      { label: 'Install solar panels', factor: 0.4, description: 'Generate your own clean energy' },
      { label: '100% green provider', factor: 0.15, description: 'Switch to renewable energy plan' },
    ],
  },
  {
    key: 'food',
    label: 'Food Reduction',
    icon: UtensilsCrossed,
    color: '#10b981',
    options: [
      { label: 'No change', factor: 1, description: 'Keep current diet' },
      { label: '3 meatless days/week', factor: 0.75, description: 'Reduce meat consumption' },
      { label: 'Vegetarian diet', factor: 0.55, description: 'No meat, includes dairy/eggs' },
      { label: 'Vegan diet', factor: 0.35, description: 'No animal products' },
    ],
  },
  {
    key: 'shopping',
    label: 'Shopping Reduction',
    icon: ShoppingBag,
    color: '#f43f5e',
    options: [
      { label: 'No change', factor: 1, description: 'Keep current shopping habits' },
      { label: 'Buy 50% second-hand', factor: 0.7, description: 'Pre-loved over new' },
      { label: 'Minimal purchases', factor: 0.4, description: 'Only essentials' },
      { label: 'Zero new purchases', factor: 0.1, description: 'Second-hand or nothing' },
    ],
  },
];

export default function Simulator() {
  const { user } = useAuth();
  const [baseline, setBaseline] = useState<Record<CarbonCategory, number>>({ transport: 0, energy: 0, food: 0, shopping: 0 });
  const [selections, setSelections] = useState<Record<CarbonCategory, number>>({ transport: 0, energy: 0, food: 0, shopping: 0 });
  const [loading, setLoading] = useState(true);
  const chartToggle = useChartToggle('chart');

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from('carbon_entries')
      .select('category, co2_kg')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const totals = {} as Record<CarbonCategory, number>;
          ALL_CATEGORIES.forEach(cat => {
            totals[cat] = (data as CarbonEntry[]).filter(e => e.category === cat).reduce((s, e) => s + Number(e.co2_kg), 0);
          });
          setBaseline(totals);
        }
        setLoading(false);
      });
  }, [user]);

  const hasData = useMemo(() => Object.values(baseline).some(v => v > 0), [baseline]);
  const baselineTotal = useMemo(() => Object.values(baseline).reduce((s, v) => s + v, 0), [baseline]);

  const factors = useMemo((): Record<CarbonCategory, number> => {
    const f = {} as Record<CarbonCategory, number>;
    for (const s of sliders) {
      f[s.key] = s.options[selections[s.key]].factor;
    }
    return f;
  }, [selections]);

  const simulated = useMemo(
    () => computeSimulatedEmissions(baseline, factors, ALL_CATEGORIES),
    [baseline, factors]
  );

  const simulatedTotal = useMemo(() => Object.values(simulated).reduce((s, v) => s + v, 0), [simulated]);
  const { savingsKg, savingsPercent } = useMemo(
    () => computeSavings(baselineTotal, simulatedTotal),
    [baselineTotal, simulatedTotal]
  );

  const baselineAnnual = useMemo(() => projectAnnualEmissions(baselineTotal), [baselineTotal]);
  const simulatedAnnual = useMemo(() => projectAnnualEmissions(simulatedTotal), [simulatedTotal]);
  const annualSavings = useMemo(() => baselineAnnual - simulatedAnnual, [baselineAnnual, simulatedAnnual]);
  const treesSaved = useMemo(() => treesNeededForOffset(annualSavings), [annualSavings]);
  const flightsSaved = useMemo(() => flightEquivalents(annualSavings), [annualSavings]);

  const chartData: ChartDataPoint[] = useMemo(() =>
    sliders.map(s => ({
      category: CATEGORY_LABELS[s.key],
      baseline: Number(baseline[s.key].toFixed(1)),
      simulated: Number(simulated[s.key].toFixed(1)),
      color: s.color,
    })),
    [baseline, simulated]
  );

  const reset = useCallback(() => setSelections({ transport: 0, energy: 0, food: 0, shopping: 0 }), []);

  const tooltipStyle = useMemo(() => ({
    background: 'rgba(255,255,255,0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
  }), []);

  const activeSliders = useMemo(() =>
    sliders.filter(s => selections[s.key] > 0),
    [selections]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-8 h-8 text-eco-500" aria-hidden="true" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">What-If Simulator</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Explore how lifestyle changes would impact your carbon footprint
          </p>
        </header>

        {!hasData && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 mb-8 text-center" role="alert">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add entries in the Calculator first to use the simulator with your real data, or use sample averages below.
            </p>
            <button
              onClick={() => setBaseline({ transport: 45, energy: 30, food: 25, shopping: 20 })}
              className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
            >
              Use Sample Data
            </button>
          </div>
        )}

        {/* Sliders */}
        <section aria-label="Lifestyle change options" className="grid sm:grid-cols-2 gap-4 mb-8">
          {sliders.map(s => {
            const Icon = s.icon;
            const selectedIdx = selections[s.key];
            return (
              <div key={s.key} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '20' }} aria-hidden="true">
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{s.label}</h3>
                </div>
                <div className="space-y-2" role="radiogroup" aria-label={s.label}>
                  {s.options.map((opt, idx) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelections(prev => ({ ...prev, [s.key]: idx }))}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 ${
                        selectedIdx === idx
                          ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                      role="radio"
                      aria-checked={selectedIdx === idx}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-medium block ${selectedIdx === idx ? 'text-eco-700 dark:text-eco-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{opt.description}</span>
                      </div>
                      <span className={`text-xs font-medium ml-2 flex-shrink-0 ${selectedIdx === idx ? 'text-eco-600 dark:text-eco-400' : 'text-gray-400'}`}>
                        {opt.factor < 1 ? `-${((1 - opt.factor) * 100).toFixed(0)}%` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Results */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8" aria-label="Impact comparison">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Impact Comparison</h2>
            <div className="flex items-center gap-3">
              <div role="radiogroup" aria-label="View mode for comparison" className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {(['chart', 'table'] as DataViewMode[]).map(m => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={chartToggle.mode === m}
                    onClick={() => chartToggle.toggle(m)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 ${
                      chartToggle.mode === m
                        ? 'bg-eco-50 dark:bg-eco-900/30 text-eco-700 dark:text-eco-400'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {m === 'chart' ? 'Chart' : 'Table'}
                  </button>
                ))}
              </div>
              <button onClick={reset} className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>

          {baselineTotal > 0 && (
            <>
              <figure role="img" aria-label={`Comparison chart showing current ${baselineTotal.toFixed(1)} kg vs simulated ${simulatedTotal.toFixed(1)} kg`} {...chartToggle.chartProps}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="baseline" fill="#9ca3af" radius={[6, 6, 0, 0]} name="Current" />
                    <Bar dataKey="simulated" radius={[6, 6, 0, 0]} name="Simulated">
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </figure>

              <div {...chartToggle.tableProps}>
                <table className="w-full text-sm" tabIndex={-1}>
                  <caption className="sr-only">Current vs simulated emissions by category</caption>
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" className="py-2 text-left font-semibold text-slate-700 dark:text-slate-300">Category</th>
                      <th scope="col" className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Current (kg)</th>
                      <th scope="col" className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Simulated (kg)</th>
                      <th scope="col" className="py-2 text-right font-semibold text-slate-700 dark:text-slate-300">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map(row => (
                      <tr key={row.category} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-slate-700 dark:text-slate-300">{row.category}</td>
                        <td className="py-2 text-right text-slate-900 dark:text-slate-100">{row.baseline}</td>
                        <td className="py-2 text-right text-slate-900 dark:text-slate-100">{row.simulated}</td>
                        <td className="py-2 text-right font-medium text-eco-600 dark:text-eco-400">
                          {row.baseline > 0 ? `-${((1 - row.simulated / row.baseline) * 100).toFixed(0)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="py-2 text-slate-700 dark:text-slate-300">Total</td>
                      <td className="py-2 text-right text-slate-900 dark:text-slate-100">{baselineTotal.toFixed(1)}</td>
                      <td className="py-2 text-right text-slate-900 dark:text-slate-100">{simulatedTotal.toFixed(1)}</td>
                      <td className="py-2 text-right text-eco-600 dark:text-eco-400">-{savingsPercent}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Summary Cards */}
        <section aria-label="Simulation results summary" className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Footprint</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{baselineTotal.toFixed(1)} kg</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Simulated Footprint</p>
            <p className="text-3xl font-bold eco-gradient-text">{simulatedTotal.toFixed(1)} kg</p>
          </div>
          <div className="bg-eco-50 dark:bg-eco-900/20 rounded-2xl p-6 border border-eco-200 dark:border-eco-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-eco-600 dark:text-eco-400" aria-hidden="true" />
              <p className="text-sm text-eco-700 dark:text-eco-400 font-medium">Potential Savings</p>
            </div>
            <p className="text-3xl font-bold text-eco-700 dark:text-eco-400">{savingsKg.toFixed(1)} kg</p>
            <p className="text-sm text-eco-600 dark:text-eco-500">({savingsPercent}% reduction)</p>
          </div>
        </section>

        {/* Environmental Equivalents */}
        {annualSavings > 0 && (
          <section aria-label="Environmental equivalents" className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Annual Environmental Impact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-eco-50 dark:bg-eco-900/20">
                <TreePine className="w-6 h-6 text-eco-600 dark:text-eco-400" aria-hidden="true" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Trees equivalent saved</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{treesSaved} trees/year</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Flight hours saved</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{flightsSaved} hours/year</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Action */}
        {savingsKg > 0 && activeSliders.length > 0 && (
          <aside className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800" aria-label="Action recommendations">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl eco-gradient flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to make these changes?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  By implementing these lifestyle changes, you could reduce your carbon footprint by {savingsPercent}%.
                  Start with the easiest change and build from there.
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeSliders.map(s => (
                    <span
                      key={s.key}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: s.color + '15', color: s.color }}
                    >
                      {s.options[selections[s.key]].label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
