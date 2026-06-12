import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { CATEGORY_CONFIG, CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '../lib/emissions';
import { validateCalculatorEntry, validateCarbonEntryInsert } from '../utils/validation';
import type { CarbonCategory, CalculatorEntry } from '../types';
import CategoryTab from '../components/ui/CategoryTab';
import EmptyState from '../components/ui/EmptyState';
import {
  Plus, Trash2, CheckCircle, ArrowRight, Lightbulb, Bike, MapPin, Fuel, AlertCircle,
} from 'lucide-react';

export default function Calculator() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CalculatorEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CarbonCategory>('transport');
  const [selectedItem, setSelectedItem] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const config = CATEGORY_CONFIG[selectedCategory];
  const total = useMemo(() => entries.reduce((sum, e) => sum + e.co2, 0), [entries]);

  const categoryTotals = useMemo(() =>
    ALL_CATEGORIES.map(cat => ({
      cat,
      label: CATEGORY_LABELS[cat],
      total: entries.filter(e => e.category === cat).reduce((s, e) => s + e.co2, 0),
      color: CATEGORY_COLORS[cat],
    })),
    [entries]
  );

  const addEntry = useCallback(() => {
    const item = config.items[selectedItem];
    const entry: CalculatorEntry = { category: selectedCategory, description: item.label, co2: item.co2 };
    const result = validateCalculatorEntry(entry);
    if (!result.success) {
      setValidationError(result.error.issues.map((e: { message: string }) => e.message).join(', '));
      return;
    }
    setValidationError(null);
    setEntries(prev => [...prev, entry]);
    setSaved(false);
  }, [config, selectedItem, selectedCategory]);

  const removeEntry = useCallback((index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const saveEntries = useCallback(async () => {
    if (!user || entries.length === 0 || !isSupabaseConfigured || !supabase) return;
    setSaving(true);
    const rows = entries.map(e => ({
      user_id: user.id,
      category: e.category,
      description: e.description,
      co2_kg: e.co2,
    }));

    for (const row of rows) {
      const result = validateCarbonEntryInsert(row);
      if (!result.success) {
        setValidationError(result.error.issues.map((e: { message: string }) => e.message).join(', '));
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from('carbon_entries').insert(rows);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setEntries([]);
      setValidationError(null);
    }
  }, [user, entries]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Carbon Footprint Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add your daily activities to track your carbon emissions
          </p>
        </header>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" role="tablist" aria-label="Emission categories">
          {ALL_CATEGORIES.map(cat => (
            <CategoryTab
              key={cat}
              category={cat}
              isActive={selectedCategory === cat}
              onClick={() => { setSelectedCategory(cat); setSelectedItem(0); }}
            />
          ))}
        </div>

        {/* Item Selection */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8" role="tabpanel" aria-label={`${config.label} activities`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Select Activity</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Emission factors sourced from {config.items[selectedItem]?.source || 'scientific literature'}
          </p>
          <div className="grid gap-2">
            {config.items.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => setSelectedItem(idx)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 ${
                  selectedItem === idx
                    ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
                aria-pressed={selectedItem === idx}
              >
                <div className="min-w-0 flex-1">
                  <span className={`text-sm font-medium block truncate ${
                    selectedItem === idx ? 'text-eco-700 dark:text-eco-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.source}</span>
                </div>
                <span className={`text-sm font-bold ml-3 flex-shrink-0 ${
                  selectedItem === idx ? 'text-eco-700 dark:text-eco-400' : 'text-gray-500'
                }`}>
                  {item.co2} kg CO2e
                </span>
              </button>
            ))}
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          <button
            onClick={addEntry}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
            disabled={saving}
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            Add to Tracker
          </button>
        </section>

        {/* Entries List */}
        {entries.length > 0 ? (
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8" aria-label="Today's entries">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Today's Entries ({entries.length})
            </h2>
            <ul className="space-y-3">
              {entries.map((entry, idx) => {
                const cfg = CATEGORY_CONFIG[entry.category];
                const Icon = cfg.icon;
                return (
                  <li key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{entry.description}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{cfg.label}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100" aria-label={`${entry.co2} kg CO2`}>
                      {entry.co2} kg
                    </span>
                    <button
                      onClick={() => removeEntry(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500"
                      aria-label={`Remove ${entry.description}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-eco-50 dark:bg-eco-900/20 border border-eco-200 dark:border-eco-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {categoryTotals.map(({ cat, label, total, color }) => (
                  <div key={cat} className="text-center">
                    <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: color }} aria-hidden="true" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{total.toFixed(1)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-eco-200 dark:border-eco-800">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-2xl font-bold eco-gradient-text">{total.toFixed(1)} kg CO2</span>
              </div>
            </div>

            <button
              onClick={saveEntries}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
              disabled={saving}
            >
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  Saved Successfully
                </>
              ) : (
                <>
                  Save to Dashboard
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </>
              )}
            </button>
          </section>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="No entries yet"
            description="Select an activity above and click Add to Tracker to begin."
          />
        )}

        {/* Tips */}
        <aside className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800" aria-label="Emission reduction tips">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-amber-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Tips</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Bike, tip: 'Bike or walk for trips under 3km to save ~2 kg CO2 per trip' },
              { icon: Fuel, tip: 'Switch to an EV and reduce transport emissions by 75%' },
              { icon: MapPin, tip: 'Buy local produce to cut food miles by up to 50%' },
              { icon: Lightbulb, tip: 'Switch to LED bulbs and save 0.5 kg CO2 per day' },
            ].map(({ icon: TipIcon, tip }) => (
              <li key={tip} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                <TipIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
