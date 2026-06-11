import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  CATEGORY_LABELS, ALL_CATEGORIES,
  projectAnnualEmissions, treesNeededForOffset, flightEquivalents,
} from '../lib/emissions';
import type { CarbonCategory, CarbonEntry, SimulatorSlider, ChartDataPoint } from '../types';
import Spinner from '../components/ui/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  FlaskConical, Car, Zap, UtensilsCrossed, ShoppingBag,
  ArrowRight, RotateCcw, TrendingDown, Info, TreePine, Plane, Leaf,
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

  useEffect(() => {
    if (!user) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasData = Object.values(baseline).some(v => v > 0);
  const baselineTotal = Object.values(baseline).reduce((s, v) => s + v, 0);

  const simulated = sliders.reduce((acc, s) => {
    const factor = s.options[selections[s.key]].factor;
    acc[s.key] = baseline[s.key] * factor;
    return acc;
  }, {} as Record<CarbonCategory, number>);

  const simulatedTotal = Object.values(simulated).reduce((s, v) => s + v, 0);
  const savings = baselineTotal - simulatedTotal;
  const savingsPercent = baselineTotal > 0 ? ((savings / baselineTotal) * 100).toFixed(0) : '0';

  const baselineAnnual = projectAnnualEmissions(baselineTotal);
  const simulatedAnnual = projectAnnualEmissions(simulatedTotal);
  const annualSavings = baselineAnnual - simulatedAnnual;
  const treesSaved = treesNeededForOffset(annualSavings);
  const flightsSaved = flightEquivalents(annualSavings);

  const chartData: ChartDataPoint[] = sliders.map(s => ({
    category: CATEGORY_LABELS[s.key],
    baseline: Number(baseline[s.key].toFixed(1)),
    simulated: Number(simulated[s.key].toFixed(1)),
    color: s.color,
  }));

  const reset = () => setSelections({ transport: 0, energy: 0, food: 0, shopping: 0 });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-8 h-8 text-eco-500" aria-hidden="true" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">What-If Simulator</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Explore how lifestyle changes would impact your carbon footprint
          </p>
        </div>

        {!hasData && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 mb-8 text-center" role="alert">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add entries in the Calculator first to use the simulator with your real data, or use sample averages below.
            </p>
            <button
              onClick={() => setBaseline({ transport: 45, energy: 30, food: 25, shopping: 20 })}
              className="btn-secondary"
            >
              Use Sample Data
            </button>
          </div>
        )}

        {/* Sliders */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
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
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        selectedIdx === idx
                          ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                      role="radio"
                      aria-checked={selectedIdx === idx}
                    >
                      <div className="min-w-0">
                        <span className={`text-sm font-medium block ${
                          selectedIdx === idx ? 'text-eco-700 dark:text-eco-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-gray-400">{opt.description}</span>
                      </div>
                      <span className={`text-xs font-medium ml-3 flex-shrink-0 ${
                        selectedIdx === idx ? 'text-eco-600 dark:text-eco-400' : 'text-gray-400'
                      }`}>
                        {opt.factor < 1 ? `-${((1 - opt.factor) * 100).toFixed(0)}%` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Impact Chart */}
        {baselineTotal > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Impact Comparison</h3>
              <button onClick={reset} className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-2" aria-label="Reset all simulator selections">
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Reset
              </button>
            </div>
            <div role="img" aria-label="Current vs simulated emissions comparison chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px' }} />
                <Bar dataKey="baseline" fill="#9ca3af" radius={[6, 6, 0, 0]} name="Current" />
                <Bar dataKey="simulated" radius={[6, 6, 0, 0]} name="Simulated">
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Footprint</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{baselineTotal.toFixed(1)} kg</p>
            <p className="text-xs text-gray-400 mt-1">monthly estimate</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Simulated Footprint</p>
            <p className="text-3xl font-bold eco-gradient-text">{simulatedTotal.toFixed(1)} kg</p>
            <p className="text-xs text-gray-400 mt-1">with selected changes</p>
          </div>
          <div className="bg-eco-50 dark:bg-eco-900/20 rounded-2xl p-6 border border-eco-200 dark:border-eco-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingDown className="w-5 h-5 text-eco-600 dark:text-eco-400" aria-hidden="true" />
              <p className="text-sm text-eco-700 dark:text-eco-400 font-medium">Potential Savings</p>
            </div>
            <p className="text-3xl font-bold text-eco-700 dark:text-eco-400">{savings.toFixed(1)} kg</p>
            <p className="text-sm text-eco-600 dark:text-eco-500">({savingsPercent}% reduction)</p>
          </div>
        </div>

        {/* Environmental Equivalents */}
        {savings > 0 && (
          <>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Annual Environmental Impact</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-eco-50 dark:bg-eco-900/20">
                  <TreePine className="w-6 h-6 text-eco-600 dark:text-eco-400" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{treesSaved} trees</p>
                    <p className="text-xs text-gray-500">worth of CO2 offset per year</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{flightsSaved} flight hrs</p>
                    <p className="text-xs text-gray-500">of emissions saved per year</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{annualSavings.toFixed(0)} kg/yr</p>
                    <p className="text-xs text-gray-500">total annual CO2 reduction</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl eco-gradient flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to make these changes?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    By implementing these lifestyle changes, you could reduce your carbon footprint by {savingsPercent}%
                    — that's {annualSavings.toFixed(0)} kg CO2 saved annually, equivalent to planting {treesSaved} trees.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sliders
                      .filter(s => selections[s.key] > 0)
                      .map(s => (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
