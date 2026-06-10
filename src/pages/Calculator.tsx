import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Car, Zap, UtensilsCrossed, ShoppingBag, Plus, Trash2,
  CheckCircle, ArrowRight, MapPin, Lightbulb, Fuel, Bike
} from 'lucide-react';

type Category = 'transport' | 'energy' | 'food' | 'shopping';

interface Entry {
  category: Category;
  description: string;
  co2: number;
}

const categoryConfig: Record<Category, { icon: typeof Car; label: string; color: string; items: { label: string; co2: number }[] }> = {
  transport: {
    icon: Car,
    label: 'Transport',
    color: 'from-blue-500 to-cyan-600',
    items: [
      { label: 'Car (gasoline) - 10km', co2: 2.3 },
      { label: 'Car (diesel) - 10km', co2: 2.1 },
      { label: 'Bus - 10km', co2: 0.9 },
      { label: 'Train - 10km', co2: 0.4 },
      { label: 'Flight - 1 hour', co2: 90 },
      { label: 'Bicycle - 10km', co2: 0 },
      { label: 'Electric car - 10km', co2: 0.5 },
    ],
  },
  energy: {
    icon: Zap,
    label: 'Energy',
    color: 'from-amber-500 to-orange-600',
    items: [
      { label: 'Electricity - 1 day (avg home)', co2: 5.5 },
      { label: 'Natural gas - 1 day', co2: 3.2 },
      { label: 'Air conditioning - 8 hours', co2: 4.0 },
      { label: 'Heating - 1 day', co2: 6.0 },
      { label: 'LED lighting - 1 day', co2: 0.3 },
    ],
  },
  food: {
    icon: UtensilsCrossed,
    label: 'Food',
    color: 'from-green-500 to-emerald-600',
    items: [
      { label: 'Beef meal', co2: 6.6 },
      { label: 'Pork meal', co2: 3.8 },
      { label: 'Chicken meal', co2: 2.5 },
      { label: 'Vegetarian meal', co2: 1.2 },
      { label: 'Vegan meal', co2: 0.6 },
      { label: 'Food waste - 1 meal', co2: 2.5 },
    ],
  },
  shopping: {
    icon: ShoppingBag,
    label: 'Shopping',
    color: 'from-rose-500 to-pink-600',
    items: [
      { label: 'New clothing item', co2: 15.0 },
      { label: 'Electronics (small)', co2: 50.0 },
      { label: 'Furniture piece', co2: 80.0 },
      { label: 'Second-hand item', co2: 2.0 },
      { label: 'Online delivery package', co2: 3.0 },
    ],
  },
};

export default function Calculator() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('transport');
  const [selectedItem, setSelectedItem] = useState(0);
  const [saved, setSaved] = useState(false);

  const config = categoryConfig[selectedCategory];
  const total = entries.reduce((sum, e) => sum + e.co2, 0);

  const addEntry = () => {
    const item = config.items[selectedItem];
    setEntries(prev => [...prev, { category: selectedCategory, description: item.label, co2: item.co2 }]);
    setSaved(false);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const saveEntries = async () => {
    if (!user || entries.length === 0) return;
    const rows = entries.map(e => ({
      user_id: user.id,
      category: e.category,
      description: e.description,
      co2_kg: e.co2,
    }));
    const { error } = await supabase.from('carbon_entries').insert(rows);
    if (!error) {
      setSaved(true);
      setEntries([]);
    }
  };

  const categoryTotals = (Object.keys(categoryConfig) as Category[]).map(cat => ({
    cat,
    total: entries.filter(e => e.category === cat).reduce((s, e) => s + e.co2, 0),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Carbon Footprint Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add your daily activities to track your carbon emissions
          </p>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {(Object.keys(categoryConfig) as Category[]).map(cat => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedItem(0); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20 shadow-lg shadow-eco-500/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-eco-700 dark:text-eco-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Item Selection */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Activity</h3>
          <div className="grid gap-2">
            {config.items.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => setSelectedItem(idx)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedItem === idx
                    ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <span className={`text-sm font-medium ${selectedItem === idx ? 'text-eco-700 dark:text-eco-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-bold ${selectedItem === idx ? 'text-eco-700 dark:text-eco-400' : 'text-gray-500'}`}>
                  {item.co2} kg CO2
                </span>
              </button>
            ))}
          </div>

          <button onClick={addEntry} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Add to Tracker
          </button>
        </div>

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Today's Entries ({entries.length})
            </h3>
            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const cfg = categoryConfig[entry.category];
                const Icon = cfg.icon;
                return (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cfg.label}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{entry.co2} kg</span>
                    <button onClick={() => removeEntry(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-xl bg-eco-50 dark:bg-eco-900/20 border border-eco-200 dark:border-eco-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {categoryTotals.map(({ cat, total }) => (
                  <div key={cat} className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{categoryConfig[cat].label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{total.toFixed(1)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-eco-200 dark:border-eco-800">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold eco-gradient-text">{total.toFixed(1)} kg CO2</span>
              </div>
            </div>

            <button onClick={saveEntries} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Saved Successfully
                </>
              ) : (
                <>
                  Save to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Tips</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Bike, tip: 'Bike or walk for trips under 3km to save ~2 kg CO2 per trip' },
              { icon: Fuel, tip: 'Switch to an EV and reduce transport emissions by 75%' },
              { icon: MapPin, tip: 'Buy local produce to cut food miles by up to 50%' },
              { icon: Zap, tip: 'Switch to LED bulbs and save 0.5 kg CO2 per day' },
            ].map(({ icon: TipIcon, tip }) => (
              <div key={tip} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                <TipIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
